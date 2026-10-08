import { resolveDiscountCode } from './discount.service';
import { getAdminApiUrl, getAdminHeaders, validateShopifyConfig } from './shopify-admin';

// Tag applied to customers created by the storefront newsletter form, so
// Shopify marketing automations (e.g. the welcome discount email) can target them.
const NEWSLETTER_TAG = 'newsletter';

// Discount code revealed on the site after a successful signup. Must exist in
// Shopify as an active "Amount off order" code.
const NEWSLETTER_DISCOUNT_CODE = process.env.NEWSLETTER_DISCOUNT_CODE || 'WELCOME20';

/**
 * Returns the welcome discount code only if it is currently redeemable in
 * Shopify, so the site never shows a code that would be rejected at checkout.
 */
export async function getNewsletterDiscountCode(): Promise<string | null> {
  const discount = await resolveDiscountCode(NEWSLETTER_DISCOUNT_CODE);
  return discount ? discount.code : null;
}

const CUSTOMER_CREATE_MUTATION = `
  mutation NewsletterCustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Only the customer id is selected — no customer PII is read back from Shopify.
const CUSTOMER_ID_BY_EMAIL_QUERY = `
  query NewsletterCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
      }
    }
  }
`;

const CONSENT_UPDATE_MUTATION = `
  mutation NewsletterConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface UserError {
  field?: string[] | null;
  message: string;
}

interface AdminGraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function adminGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(getAdminApiUrl('/graphql.json'), {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Shopify Admin API responded with ${response.status}`);
  }

  const json = (await response.json()) as AdminGraphqlResponse<T>;
  if (json.errors?.length || !json.data) {
    throw new Error(json.errors?.map((e) => e.message).join('; ') || 'Empty Shopify Admin API response');
  }

  return json.data;
}

function throwOnUserErrors(errors: UserError[] | undefined): void {
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }
}

/**
 * Subscribe an email address to email marketing in Shopify. Creates a new
 * customer when the address is unknown, otherwise opts the existing customer in.
 */
export async function subscribeToNewsletter(email: string): Promise<void> {
  validateShopifyConfig();

  const consent = {
    marketingState: 'SUBSCRIBED',
    marketingOptInLevel: 'SINGLE_OPT_IN',
    consentUpdatedAt: new Date().toISOString(),
  };

  const created = await adminGraphql<{
    customerCreate: { customer: { id: string } | null; userErrors: UserError[] };
  }>(CUSTOMER_CREATE_MUTATION, {
    input: { email, tags: [NEWSLETTER_TAG], emailMarketingConsent: consent },
  });

  const createErrors = created.customerCreate.userErrors;
  if (created.customerCreate.customer) return;

  const emailTaken = createErrors.some((e) => /taken/i.test(e.message));
  if (!emailTaken) {
    throwOnUserErrors(createErrors);
    throw new Error('Shopify did not create the customer');
  }

  // Existing customer: opt them in instead.
  const existing = await adminGraphql<{ customers: { nodes: Array<{ id: string }> } }>(
    CUSTOMER_ID_BY_EMAIL_QUERY,
    { query: `email:"${email}"` }
  );
  const customerId = existing.customers.nodes[0]?.id;
  if (!customerId) {
    throw new Error('Existing customer could not be found for newsletter opt-in');
  }

  const updated = await adminGraphql<{
    customerEmailMarketingConsentUpdate: { userErrors: UserError[] };
  }>(CONSENT_UPDATE_MUTATION, {
    input: { customerId, emailMarketingConsent: consent },
  });
  throwOnUserErrors(updated.customerEmailMarketingConsentUpdate.userErrors);
}
