import type { Metadata } from 'next';
import { Header, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Privacy Policy | Online Blinds Express',
  description: 'Learn how Online Blinds Express collects, uses, and protects your personal information.',
};

const sections = [
  {
    heading: 'Personal Information We Collect or Process',
    content: (
      <>
        <p>
          When we use the term &ldquo;personal information,&rdquo; we are referring to information that identifies or can
          reasonably be linked to you or another person. Personal information does not include information that is
          collected anonymously or that has been de-identified, so that it cannot identify or be reasonably linked to you.
          We may collect or process the following categories of personal information, including inferences drawn from this
          personal information, depending on how you interact with the Services, where you live, and as permitted or
          required by applicable law:
        </p>
        <ul>
          <li>
            <strong>Contact details</strong> including your name, address, billing address, shipping address, phone
            number, and email address.
          </li>
          <li>
            <strong>Financial information</strong> including credit card, debit card, and financial account numbers,
            payment card information, financial account information, transaction details, form of payment, payment
            confirmation and other payment details.
          </li>
          <li>
            <strong>Account information</strong> including your username, password, security questions, preferences and
            settings.
          </li>
          <li>
            <strong>Transaction information</strong> including the items you view, put in your cart, add to your
            wishlist, or purchase, return, exchange or cancel and your past transactions.
          </li>
          <li>
            <strong>Communications with us</strong> including the information you include in communications with us, for
            example, when sending a customer support inquiry.
          </li>
          <li>
            <strong>Device information</strong> including information about your device, browser, or network connection,
            your IP address, and other unique identifiers.
          </li>
          <li>
            <strong>Usage information</strong> including information regarding your interaction with the Services,
            including how and when you interact with or navigate the Services.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Personal Information Sources',
    content: (
      <>
        <p>We may collect personal information from the following sources:</p>
        <ul>
          <li>
            <strong>Directly from you</strong> including when you create an account, visit or use the Services,
            communicate with us, or otherwise provide us with your personal information.
          </li>
          <li>
            <strong>Automatically through the Services</strong> including from your device when you use our products or
            services or visit our websites, and through the use of cookies and similar technologies.
          </li>
          <li>
            <strong>From our service providers</strong> including when we engage them to enable certain technology and
            when they collect or process your personal information on our behalf.
          </li>
          <li>
            <strong>From our partners or other third parties.</strong>
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: 'How We Use Your Personal Information',
    content: (
      <>
        <p>
          Depending on how you interact with us or which of the Services you use, we may use personal information for
          the following purposes:
        </p>
        <ul>
          <li>
            <strong>Provide, Tailor, and Improve the Services.</strong> We use your personal information to provide you
            with the Services, including to perform our contract with you, to process your payments, to fulfill your
            orders, to remember your preferences and items you are interested in, to send notifications to you related to
            your account, to process purchases, returns, exchanges or other transactions, to create, maintain and
            otherwise manage your account, to arrange for shipping, to facilitate any returns and exchanges, to enable
            you to post reviews, and to create a customized shopping experience for you, such as recommending products
            related to your purchases. This may include using your personal information to better tailor and improve the
            Services.
          </li>
          <li>
            <strong>Marketing and Advertising.</strong> We use your personal information for marketing and promotional
            purposes, such as to send marketing, advertising and promotional communications by email, text message or
            postal mail, and to show you online advertisements for products or services on the Services or other
            websites, including based on items you previously have purchased or added to your cart and other activity on
            the Services.
          </li>
          <li>
            <strong>Security and Fraud Prevention.</strong> We use your personal information to authenticate your
            account, to provide a secure payment and shopping experience, detect, investigate or take action regarding
            possible fraudulent, illegal, unsafe, or malicious activity, protect public safety, and to secure our
            services. If you choose to use the Services and register an account, you are responsible for keeping your
            account credentials safe. We highly recommend that you do not share your username, password or other access
            details with anyone else.
          </li>
          <li>
            <strong>Communicating with You.</strong> We use your personal information to provide you with customer
            support, to be responsive to you, to provide effective services to you and to maintain our business
            relationship with you.
          </li>
          <li>
            <strong>Legal Reasons.</strong> We use your personal information to comply with applicable law or respond to
            valid legal process, including requests from law enforcement or government agencies, to investigate or
            participate in civil discovery, potential or actual litigation, or other adversarial legal proceedings, and
            to enforce or investigate potential violations of our terms or policies.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: 'How We Disclose Personal Information',
    content: (
      <>
        <p>
          In certain circumstances, we may disclose your personal information to third parties for legitimate purposes
          subject to this Privacy Policy. Such circumstances may include:
        </p>
        <ul>
          <li>
            With Shopify, vendors and other third parties who perform services on our behalf (e.g. IT management,
            payment processing, data analytics, customer support, cloud storage, fulfillment and shipping).
          </li>
          <li>
            With business and marketing partners to provide marketing services and advertise to you. Our business and
            marketing partners will use your information in accordance with their own privacy notices.
          </li>
          <li>
            When you direct, request us or otherwise consent to our disclosure of certain information to third parties,
            such as to ship you products or through your use of social media widgets or login integrations.
          </li>
          <li>With our affiliates or otherwise within our corporate group.</li>
          <li>
            In connection with a business transaction such as a merger or bankruptcy, to comply with any applicable
            legal obligations (including to respond to subpoenas, search warrants and similar requests), to enforce any
            applicable terms of service or policies, and to protect or defend the Services, our rights, and the rights
            of our users or others.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Relationship with Shopify',
    content: (
      <p>
        The Services are hosted by Shopify, which collects and processes personal information about your access to and
        use of the Services in order to provide and improve the Services for you. Information you submit to the Services
        will be transmitted to and shared with Shopify as well as third parties that may be located in countries other
        than where you reside. To learn more about how Shopify uses your personal information and any rights you may
        have, you can visit the{' '}
        <a
          href="https://www.shopify.com/legal/privacy/consumers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          Shopify Consumer Privacy Policy
        </a>
        . You may also exercise certain rights with respect to your personal information at the{' '}
        <a
          href="https://privacy.shopify.com/en"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          Shopify Privacy Portal
        </a>
        .
      </p>
    ),
  },
  {
    heading: 'Third Party Websites and Links',
    content: (
      <p>
        The Services may provide links to websites or other online platforms operated by third parties. If you follow
        links to sites not affiliated or controlled by us, you should review their privacy and security policies and
        other terms and conditions. We do not guarantee and are not responsible for the privacy or security of such
        sites, including the accuracy, completeness, or reliability of information found on these sites. Our inclusion
        of such links does not, by itself, imply any endorsement of the content on such platforms or of their owners or
        operators.
      </p>
    ),
  },
  {
    heading: "Children's Data",
    content: (
      <p>
        The Services are not intended to be used by children, and we do not knowingly collect any personal information
        about children under the age of majority in your jurisdiction. If you are the parent or guardian of a child who
        has provided us with their personal information, you may contact us using the contact details set out below to
        request that it be deleted. As of the Effective Date of this Privacy Policy, we do not have actual knowledge
        that we &ldquo;share&rdquo; or &ldquo;sell&rdquo; (as those terms are defined in applicable law) personal
        information of individuals under 16 years of age.
      </p>
    ),
  },
  {
    heading: 'Security and Retention of Your Information',
    content: (
      <p>
        Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee &ldquo;perfect
        security.&rdquo; In addition, any information you send to us may not be secure while in transit. We recommend
        that you do not use unsecure channels to communicate sensitive or confidential information to us. How long we
        retain your personal information depends on different factors, such as whether we need the information to
        maintain your account, to provide you with Services, comply with legal obligations, resolve disputes or enforce
        other applicable contracts and policies.
      </p>
    ),
  },
  {
    heading: 'Your Rights and Choices',
    content: (
      <>
        <p>
          Depending on where you live, you may have some or all of the rights listed below in relation to your personal
          information. However, these rights are not absolute, may apply only in certain circumstances and, in certain
          cases, we may decline your request as permitted by law.
        </p>
        <ul>
          <li>
            <strong>Right to Access / Know.</strong> You may have a right to request access to personal information
            that we hold about you.
          </li>
          <li>
            <strong>Right to Delete.</strong> You may have a right to request that we delete personal information we
            maintain about you.
          </li>
          <li>
            <strong>Right to Correct.</strong> You may have a right to request that we correct inaccurate personal
            information we maintain about you.
          </li>
          <li>
            <strong>Right of Portability.</strong> You may have a right to receive a copy of the personal information
            we hold about you and to request that we transfer it to a third party, in certain circumstances and with
            certain exceptions.
          </li>
          <li>
            <strong>Managing Communication Preferences.</strong> We may send you promotional emails, and you may opt
            out of receiving these at any time by using the unsubscribe option displayed in our emails to you.
          </li>
        </ul>
        <p>
          If you reside in the UK or European Economic Area, and subject to exceptions and limitations provided by
          local law, you may also exercise the following rights:
        </p>
        <ul>
          <li>
            <strong>Objection to Processing and Restriction of Processing:</strong> You may have the right to ask us to
            stop or restrict our processing of personal information for certain purposes.
          </li>
          <li>
            <strong>Withdrawal of Consent:</strong> Where we rely on consent to process your personal information, you
            have the right to withdraw this consent.
          </li>
        </ul>
        <p>
          We will not discriminate against you for exercising any of these rights. We may need to verify your identity
          before we can process your requests. To learn more about how Shopify uses your personal information and any
          rights you may have, you can visit{' '}
          <a
            href="https://privacy.shopify.com/en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            https://privacy.shopify.com/en
          </a>
          .
        </p>
      </>
    ),
  },
  {
    heading: 'Complaints',
    content: (
      <p>
        If you have complaints about how we process your personal information, please contact us using the contact
        details provided below. Depending on where you live, you may have the right to appeal our decision by contacting
        us using the contact details set out below, or lodge your complaint with your local data protection authority.
        For the EEA, you can find a list of the responsible data protection supervisory authorities{' '}
        <a
          href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
        >
          here
        </a>
        .
      </p>
    ),
  },
  {
    heading: 'International Transfers',
    content: (
      <p>
        Please note that we may transfer, store and process your personal information outside the country you live in.
        If we transfer your personal information out of the European Economic Area or the United Kingdom, we will rely
        on recognized transfer mechanisms like the European Commission&apos;s Standard Contractual Clauses, or any
        equivalent contracts issued by the relevant competent authority of the UK, as relevant, unless the data transfer
        is to a country that has been determined to provide an adequate level of protection.
      </p>
    ),
  },
  {
    heading: 'Changes to This Privacy Policy',
    content: (
      <p>
        We may update this Privacy Policy from time to time, including to reflect changes to our practices or for other
        operational, legal, or regulatory reasons. We will post the revised Privacy Policy on this website, update the
        &ldquo;Last updated&rdquo; date and provide notice as required by applicable law.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-foreground py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="font-jost text-[13px] font-medium uppercase tracking-[0.7px] text-white/60">
              Legal
            </p>
            <h1 className="mt-2 font-display text-[32px] font-semibold leading-tight text-white md:text-[48px]">
              Privacy Policy
            </h1>
            <p className="mt-3 font-jost text-[15px] text-white/70">
              Last updated: April 22, 2026
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="mx-auto max-w-[860px] px-6 pt-10 pb-4">
          <p className="font-jost text-[15px] leading-[1.75] text-muted">
            Online Blinds Express operates this store and website, including all related information, content, features,
            tools, products and services, in order to provide you, the customer, with a curated shopping experience (the
            &ldquo;Services&rdquo;). This Privacy Policy describes how we collect, use, and disclose your personal information
            when you visit, use, or make a purchase or other transaction using the Services or otherwise communicate with
            us. If there is a conflict between our Terms of Service and this Privacy Policy, this Privacy Policy controls
            with respect to the collection, processing, and disclosure of your personal information.
          </p>
          <p className="mt-4 font-jost text-[15px] leading-[1.75] text-muted">
            Please read this Privacy Policy carefully. By using and accessing any of the Services, you acknowledge that
            you have read this Privacy Policy and understand the collection, use, and disclosure of your information as
            described in this Privacy Policy.
          </p>
        </section>

        {/* Sections */}
        <section className="mx-auto max-w-[860px] px-6 pb-16 pt-4">
          <div className="divide-y divide-border">
            {sections.map((section) => (
              <div key={section.heading} className="py-8">
                <h2 className="mb-4 font-display text-[20px] font-semibold text-foreground md:text-[22px]">
                  {section.heading}
                </h2>
                <div className="prose-policy font-jost text-[15px] leading-[1.75] text-muted [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary/80 [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_ul+p]:mt-3">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-[860px] px-6 py-12">
            <h2 className="mb-3 font-display text-[20px] font-semibold text-foreground md:text-[22px]">
              Contact
            </h2>
            <p className="font-jost text-[15px] leading-[1.75] text-muted">
              Should you have any questions about our privacy practices or this Privacy Policy, or if you would like to
              exercise any of the rights available to you, please contact us:
            </p>
            <div className="mt-5 flex flex-col gap-3 font-jost text-[15px] text-foreground">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a
                  href="mailto:onlineblindsexpressltd@gmail.com"
                  className="text-primary underline hover:text-primary/80"
                >
                  onlineblindsexpressltd@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <address className="not-italic text-muted">
                  Carlinghow Mills, Unit C41<br />
                  Batley, ENG, WF17 8LL<br />
                  United Kingdom
                </address>
              </div>
            </div>
            <p className="mt-5 font-jost text-[14px] text-muted">
              For the purpose of applicable data protection laws, we are the data controller of your personal
              information.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
