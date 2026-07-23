import {
  Header,
  Hero,
  CategoryGrid,
  BestSelling,
  Craftsmanship,
  FreeSamples,
  FAQ,
  Footer,
} from '@/components';
import TrustBar from '@/components/home/TrustBar';
import EmailCapture from '@/components/home/EmailCapture';

// Regenerate hourly so the server-rendered Best Sellers section re-fetches prices
// and recovers if a build/regeneration ever hit a transient pricing failure.
export const revalidate = 3_600;
// Headroom for the Shopify Admin price-band scan during regeneration.
export const maxDuration = 60;

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <CategoryGrid />
        <BestSelling />
        <Craftsmanship />
        <FreeSamples />
        <EmailCapture />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
