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

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <CategoryGrid />
        <BestSelling />
        <Craftsmanship />
        <FreeSamples />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
