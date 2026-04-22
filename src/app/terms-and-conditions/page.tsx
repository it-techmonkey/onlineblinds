import type { Metadata } from 'next';
import { Header, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Online Blinds Express',
  description: 'Read the terms and conditions for using the Online Blinds Express website and purchasing our made-to-measure blinds.',
};

const sections = [
  {
    heading: 'Product',
    content: (
      <p>
        The images are purely for illustration purposes only. We aim to manufacture the blinds as close as possible to
        the illustrations provided. As all our blinds are uniquely handcrafted, we do not compromise on quality, and all
        our products are manufactured to a high-quality standard. Our products are accurately displayed on the website;
        however, depending on your screen monitor, the colour or shading may appear differently on different screen
        types. You can also view the website on different platforms such as mobile devices (Android and iOS) including
        tablets, as the website is user friendly.
      </p>
    ),
  },
  {
    heading: 'Measurements',
    content: (
      <>
        <p>
          The goods that you order are manufactured according to the measurements you provide. It is vital that you take
          the correct measurements of your window. If you are unsure, please visit our Measuring &amp; Fitting guide on
          our website for further information, or contact us by email for guidance on how to take the required
          measurements accurately.
        </p>
        <p>
          Please ensure that before placing your order online or by phone you check the product details and measurements
          of the goods. <strong>We cannot accept returns or refund the money if you have given us incorrect
          measurements</strong>, as we will not be able to resell the goods — they are made to measure and bespoke.
        </p>
      </>
    ),
  },
  {
    heading: 'Made to Measure Products',
    content: (
      <p>
        Once the product is made to your precise requirements, it is only suitable for you and therefore cannot be
        cancelled or returned. It is important to check the product you want and the size you require.{' '}
        <strong>Double check your order to ensure that the products ordered and measurements taken are correct.</strong>
      </p>
    ),
  },
  {
    heading: 'Fabric',
    content: (
      <p>
        Our fabrics are made from raw materials into high quality with different shades and variations. The colour on
        fabrics is dyed, therefore shades can be slightly different per batch. The print design of some pattern fabrics
        may not show the full range of colours or pattern design on the sample. If you are unsure about the fabrics,
        please contact us via email for further information.
      </p>
    ),
  },
  {
    heading: 'Tolerance',
    content: (
      <p>
        The fabric will be cut by our high-class team within a variance of <strong>+/- 3cm</strong>. Please be aware
        that if the sizes are within this tolerance limit, we will not replace the order and you will not be entitled to
        reject the goods.
      </p>
    ),
  },
  {
    heading: 'Ordering via Telephone',
    content: (
      <p>
        Our customer services team will help you with your measurements if you are unsure. As a confirmation, our team
        will repeat your entire order back to you so you can confirm it is correct or make any adjustments. Once an
        order is placed you will receive an email confirmation of your order.
      </p>
    ),
  },
  {
    heading: 'Price & Payment',
    content: (
      <>
        <p>
          The price displayed on the website at the time we receive your order applies. Prices are subject to change at
          any time. We take payment from you at the time you place your order using the credit or debit card details
          supplied by you during the checkout process.
        </p>
        <p>Information that we need to process your order:</p>
        <ul>
          <li>Full name</li>
          <li>Contact number</li>
          <li>Address / postcode</li>
          <li>Email address</li>
          <li>Debit / credit card details</li>
        </ul>
      </>
    ),
  },
  {
    heading: '1 Year Guarantee',
    content: (
      <p>
        Online Blinds Express offers a 1 year manufacturer&apos;s guarantee on manufacturing faults. We will inspect
        the product and, if the issue can be resolved, we will repair it. If not, we will replace the product with a
        brand new one.
      </p>
    ),
  },
  {
    heading: 'Defective and Damaged Goods',
    content: (
      <p>
        Online Blinds Express products go through a quality check process before dispatch. If you do experience any
        problems, please email us. You will have <strong>7 days</strong> from receipt of your product to report any
        defective or damaged goods due to manufacturing, or damage caused during the delivery process. For any issues
        regarding the product, we will need photos so our management team can investigate. We may also ask for the
        product to be returned to us for inspection. Any queries will be dealt with in a highly professional and prompt
        manner.
      </p>
    ),
  },
  {
    heading: 'Disclaimer',
    content: (
      <p>
        Online Blinds Express will take every care and precaution to ensure that the contents and information published
        on this website are accurate and up to date. Unfortunately, we cannot guarantee the accuracy of contents or
        information contained in its pages, and any person using information contained in them does so entirely at their
        own risk. Please verify the accuracy of any information before acting upon it. We reserve the right to change
        information at any time without notice.
      </p>
    ),
  },
];

export default function TermsAndConditionsPage() {
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
              Terms &amp; Conditions
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className="mx-auto max-w-[860px] px-6 pt-10 pb-4">
          <p className="font-jost text-[15px] leading-[1.75] text-muted">
            Using our Online Blinds Express website is maintained for your personal use and viewing. Please read our
            Conditions of Use carefully. Accessing and using this website constitutes acceptance by you of these
            conditions. We reserve the right to change the Conditions of Use at any time. We advise you to review the
            Conditions of Use on a regular basis. Accessing and using this website after such changes have been posted
            constitutes acceptance by you of these conditions.
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
                <div className="font-jost text-[15px] leading-[1.75] text-muted [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
