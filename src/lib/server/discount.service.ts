import { getAdminApiUrl, getAdminHeaders, validateShopifyConfig } from './shopify-admin';

export interface ResolvedDiscount {
  code: string;
  title: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
}

const CODE_DISCOUNT_QUERY = `
  query CodeDiscountNodeByCode($code: String!) {
    codeDiscountNodeByCode(code: $code) {
      codeDiscount {
        __typename
        ... on DiscountCodeBasic {
          title
          status
          startsAt
          endsAt
          usageLimit
          asyncUsageCount
          customerGets {
            value {
              __typename
              ... on DiscountPercentage {
                percentage
              }
              ... on DiscountAmount {
                amount {
                  amount
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface CodeDiscountNodeResponse {
  data?: {
    codeDiscountNodeByCode?: {
      codeDiscount?: {
        __typename?: string;
        title?: string;
        status?: string;
        startsAt?: string;
        endsAt?: string | null;
        usageLimit?: number | null;
        asyncUsageCount?: number;
        customerGets?: {
          value?: {
            __typename?: string;
            percentage?: number;
            amount?: { amount?: string };
          };
        };
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

/**
 * Look up a discount code against Shopify's active price rules and, if it's
 * currently redeemable, return its discount value. Draft orders don't accept
 * a "redeem this code" call the way storefront checkout does — the code has
 * to be resolved to a value here and then applied as an appliedDiscount on
 * the draft order.
 *
 * Returns null for anything that isn't a currently-usable basic percentage or
 * fixed-amount code (not found, inactive, outside its date window, usage
 * limit reached, or a non-order-level discount type like free shipping /
 * buy-x-get-y, which draft orders can't represent this way).
 */
export async function resolveDiscountCode(rawCode: string): Promise<ResolvedDiscount | null> {
  const code = rawCode.trim();
  if (!code) return null;

  validateShopifyConfig();

  const response = await fetch(getAdminApiUrl('/graphql.json'), {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ query: CODE_DISCOUNT_QUERY, variables: { code } }),
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error(`[DiscountService] Discount lookup failed for "${code}": ${response.status}`);
    return null;
  }

  const json = (await response.json()) as CodeDiscountNodeResponse;
  if (json.errors?.length) {
    console.error(`[DiscountService] Discount lookup GraphQL error for "${code}":`, json.errors[0]?.message);
    return null;
  }

  const codeDiscount = json.data?.codeDiscountNodeByCode?.codeDiscount;
  if (!codeDiscount || codeDiscount.__typename !== 'DiscountCodeBasic') {
    return null;
  }

  if (codeDiscount.status !== 'ACTIVE') return null;

  const now = Date.now();
  if (codeDiscount.startsAt && new Date(codeDiscount.startsAt).getTime() > now) return null;
  if (codeDiscount.endsAt && new Date(codeDiscount.endsAt).getTime() < now) return null;
  if (
    typeof codeDiscount.usageLimit === 'number' &&
    typeof codeDiscount.asyncUsageCount === 'number' &&
    codeDiscount.asyncUsageCount >= codeDiscount.usageLimit
  ) {
    return null;
  }

  const value = codeDiscount.customerGets?.value;
  if (value?.__typename === 'DiscountPercentage' && typeof value.percentage === 'number') {
    return {
      code,
      title: codeDiscount.title || code,
      type: 'percentage',
      // Shopify reports this as a decimal (0.1 = 10%); the rest of the app
      // works in whole percentage points.
      value: value.percentage * 100,
    };
  }
  if (value?.__typename === 'DiscountAmount' && value.amount?.amount) {
    return {
      code,
      title: codeDiscount.title || code,
      type: 'fixed_amount',
      value: Number(value.amount.amount),
    };
  }

  return null;
}
