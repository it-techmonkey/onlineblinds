import type { Metadata } from 'next';
import { Header, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Online Blinds Express',
  description: 'Read the terms and conditions for using the Online Blinds Express website and purchasing our made-to-measure blinds.',
};

const sections = [
  {
    heading: 'General',
    content: (
      <>
        <p>
          This website is operated by Online Blinds Express. By accessing or using this website, you agree to be bound by
          these Terms &amp; Conditions.
        </p>
        <p>
          We reserve the right to update or modify these Terms at any time without prior notice. Continued use of the site
          after changes are posted constitutes your acceptance of the new Terms.
        </p>
      </>
    ),
  },
  {
    heading: 'Inspect a Faulty Blind',
    content: (
      <>
        <p>
          If blinds are returned for inspection following a fault claim, they must be resent in their original packaging.
        </p>
        <p>
          If, upon thorough examination, no fault is found, the cost of re-delivery will be charged to the customer.
        </p>
      </>
    ),
  },
  {
    heading: 'Product Specifications & Accuracy',
    content: (
      <>
        <p>
          All images on our website are for illustrative purposes only. While we strive for accuracy, colours and
          textures may appear differently depending on your screen settings and lighting. We strongly recommend ordering
          free samples before placing a final order.
        </p>
        <p>
          As our blinds are handcrafted, minor variations may occur. Our fabrics are made from raw materials into high
          quality products with different shades and variations. Fabric colours are dyed, therefore shades can be
          slightly different per batch. The print design of some patterned fabrics may not show the full range of colours
          or pattern design on the sample.
        </p>
        <p>
          Please note a machine tolerance of <strong>+/- 4mm</strong>, or up to <strong>6mm</strong> depending on fabric
          type, on all blinds. If a product falls within this tolerance, it is not deemed faulty.
        </p>
        <p>
          Large Day &amp; Night blinds over <strong>1800mm</strong> wide may exhibit a slight wave effect due to size and
          fabric weight restrictions.
        </p>
      </>
    ),
  },
  {
    heading: 'Measurements & Custom Orders',
    content: (
      <>
        <p>
          All goods are made to the specific measurements provided by you. It is your responsibility to ensure these
          measurements are accurate. Please refer to our Measuring &amp; Fitting guide if you are unsure, or contact us by
          email for guidance on how to take the required measurements accurately.
        </p>
        <p>
          Please ensure that before placing your order online or by phone you check the product details and measurements
          of the goods. Because our products are bespoke and made-to-measure, we cannot accept returns, cancellations, or
          refunds if the measurements provided were incorrect.
        </p>
      </>
    ),
  },
  {
    heading: 'Ordering & Payment',
    content: (
      <>
        <p>
          A contract is formed once we send an order confirmation email to the address provided. If you order by
          telephone, our customer services team will repeat your order back to you so you can confirm it is correct
          before the order is placed.
        </p>
        <p>
          All prices include VAT where applicable. We reserve the right to adjust pricing at any time. In the event of a
          pricing error, we reserve the right to cancel the order and issue a full refund.
        </p>
        <p>
          Discount codes must be applied at the time of checkout and cannot be added retrospectively.
        </p>
      </>
    ),
  },
  {
    heading: 'Delivery',
    content: (
      <>
        <p>
          Manufacturing typically takes <strong>3-5 working days</strong>, followed by dispatch. While we aim for swift
          delivery, timeframes are estimates and not guarantees.
        </p>
        <p>
          All deliveries must be signed for. If the packaging appears damaged upon arrival, please sign for the item as
          &ldquo;Damaged&rdquo; and notify us immediately.
        </p>
        <p>
          Multiple unsuccessful delivery attempts may result in re-delivery charges. Items returned to us will be held
          for <strong>4 weeks</strong> before disposal.
        </p>
      </>
    ),
  },
  {
    heading: 'Damaged or Defective Goods',
    content: (
      <>
        <p>
          Any damage or manufacturing defects must be reported via email to{' '}
          <a href="mailto:sales@onlineblindsexpress.co.uk">sales@onlineblindsexpress.co.uk</a> within{' '}
          <strong>3 working days</strong> of delivery.
        </p>
        <p>
          Do not install or fit the blind if it is damaged. We may require photographic evidence or the return of the
          item for inspection.
        </p>
        <p>
          If a fault is confirmed, we will provide a like-for-like replacement. We cannot change measurements or colours
          during the replacement process.
        </p>
      </>
    ),
  },
  {
    heading: 'Cancellations & Returns',
    content: (
      <>
        <p>
          Orders cannot be cancelled or changed once they have entered the manufacturing process.
        </p>
        <p>
          If an item is discontinued or out of stock, we will offer an alternative or a full refund.
        </p>
      </>
    ),
  },
  {
    heading: '5-Year Manufacturer’s Warranty',
    content: (
      <>
        <p>
          We provide a <strong>5-year warranty</strong> against manufacturing defects on components and fabrics.
        </p>
        <p>This warranty does not cover:</p>
        <ul>
          <li>Fair wear and tear.</li>
          <li>Misuse, accidental damage, pet damage, or alterations.</li>
          <li>Fading caused by prolonged exposure to sunlight.</li>
          <li>Incorrect installation.</li>
          <li>Blinds used in non-domestic or commercial environments.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Limitation of Liability',
    content: (
      <>
        <p>
          Online Blinds Express shall not be liable for any indirect or consequential loss, damage, or expenses arising
          from the use of our products or delays in delivery.
        </p>
        <p>
          Our total liability shall not exceed the value of the goods ordered.
        </p>
      </>
    ),
  },
  {
    heading: 'Privacy & Data Protection',
    content: (
      <p>
        We are committed to protecting your privacy. Your data is handled in accordance with our Privacy Policy and is
        only shared with third parties, such as couriers, where necessary to fulfil your order.
      </p>
    ),
  },
  {
    heading: 'Condensation Disclaimer & Limitation of Liability',
    content: (
      <>
        <p>
          Blinds and other window coverings may contribute to reduced airflow between the room and the window glass.
          Under certain environmental conditions, including but not limited to high indoor humidity levels, temperature
          differentials, inadequate ventilation, or existing window seal deficiencies, condensation may form on window
          glass, frames, or surrounding surfaces.
        </p>
        <p>
          Condensation is a natural occurrence resulting from environmental conditions and is not caused by defects in
          the blinds themselves. The installation of blinds may increase the likelihood of condensation by limiting air
          circulation against the window surface.
        </p>
        <p>Online Blinds Express shall not be held liable for:</p>
        <ul>
          <li>Condensation or moisture accumulation on windows or frames.</li>
          <li>Water damage, staining, or deterioration of window sills, walls, or surrounding materials.</li>
          <li>Mold or mildew growth resulting from environmental humidity or condensation.</li>
          <li>Seal failure or performance issues of insulated glass units.</li>
          <li>Any secondary damage arising from excess indoor humidity levels.</li>
        </ul>
        <p>
          It is the property owner&apos;s responsibility to maintain appropriate indoor humidity levels, ensure adequate
          ventilation, and properly maintain windows and glazing systems.
        </p>
        <p>
          By purchasing and/or installing blinds, the customer acknowledges and accepts that condensation is an
          environmental condition beyond Online Blinds Express&apos;s control.
        </p>
      </>
    ),
  },
  {
    heading: 'Manufacturing & Distribution',
    content: (
      <>
        <p>
          Our products are manufactured and distributed globally through our production facilities located in Texas (USA),
          Leeds (United Kingdom), and Guangzhou (China). These facilities support our international supply chain and enable
          the efficient fulfillment of customer orders across North America, Europe, Asia, and other global markets.
        </p>
        <p>
          Company reserves the right to manufacture, source, and distribute products from any of its facilities or approved
          partners as required to meet operational and customer requirements.
        </p>
      </>
    ),
  },
  {
    heading: 'Contact Us',
    content: (
      <>
        <p>
          For any queries regarding these terms, please contact us by email at{' '}
          <a href="mailto:sales@onlineblindsexpress.co.uk">sales@onlineblindsexpress.co.uk</a>.
        </p>
        <p>
          Response time: <strong>1-3 working days</strong>.
        </p>
      </>
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
            Please read our Terms &amp; Conditions carefully. Accessing and using this website constitutes acceptance by
            you of these terms. We reserve the right to change these Terms &amp; Conditions at any time, and accessing or
            using this website after such changes have been posted constitutes acceptance by you of the updated terms.
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
                <div className="font-jost text-[15px] leading-[1.75] text-muted [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary/80 [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul+p]:mt-3">
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
