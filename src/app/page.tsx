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
