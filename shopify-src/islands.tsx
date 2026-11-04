import React from 'react';
import { CartProvider, Image, Link } from './adapters/runtime';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Hero from '@/components/home/Hero';
import TrustBar from '@/components/home/TrustBar';
import CategoryGrid from '@/components/home/CategoryGrid';
import Craftsmanship from '@/components/home/Craftsmanship';
import FreeSamples from '@/components/home/FreeSamples';
import BestSelling from '@/components/home/BestSelling';
import FAQ from '@/components/home/FAQ';
import EmailCapture from '@/components/home/EmailCapture';
import SignupPopup from '@/components/layout/SignupPopup';
import About from '@/app/about/page';
import Contact from '@/app/contact/page';
import Guides from '@/app/guides/page';
import FaqPage from '@/app/faq/page';
import Warranty from '@/app/warranty/page';
import Privacy from '@/app/privacy-policy/page';
import Refund from '@/app/refund-policy/page';
import Shipping from '@/app/shipping-policy/page';
import Terms from '@/app/terms-and-conditions/page';
import CategoryHero from '@/components/collection/CategoryHero';
import CategoryInfoSection from '@/components/collection/CategoryInfoSection';
import ProductGallery from '@/components/product/ProductGallery';
import ProductUrgencyBar from '@/components/product/ProductUrgencyBar';
import ProductTrustStrip from '@/components/product/ProductTrustStrip';
import { BlackoutFeaturesSection } from '@/components/product/BlackoutFeaturesSection';
import GlobalPolish from '@/components/ui/GlobalPolish';
import { CollectionGrid, BestSellerGrid, Delivery, EmptyCart } from './catalog';
import { ProductPreview, ProductContent } from './product-preview';
import { CartDesign } from './cart-design';
import { CollectionDesign } from './collection-design';
import { SearchDesign } from './search-design';

export const islands: Record<string, React.ComponentType<any>> = {
  header: () => <CartProvider><Header /></CartProvider>, footer: Footer,
  announcement: AnnouncementBar, hero: Hero, trust: TrustBar, categories: CategoryGrid,
  craftsmanship: Craftsmanship, samples: FreeSamples, faq: FAQ, newsletter: EmailCapture,
  'best-selling': BestSelling as any,
  'empty-cart': EmptyCart,
  'product-preview': ProductPreview, 'product-content': ProductContent,
  'cart-design': CartDesign,
  'search-design': SearchDesign,
  about: About, contact: Contact, guides: Guides, 'faq-page': FaqPage, warranty: Warranty,
  privacy: Privacy, refund: Refund, shipping: Shipping, terms: Terms,
  'category-hero': CategoryHero, 'category-info': CategoryInfoSection,
  gallery: ProductGallery, urgency: ProductUrgencyBar, 'product-trust': ProductTrustStrip,
  'blackout-features': BlackoutFeaturesSection, polish: GlobalPolish, 'signup-popup': SignupPopup,
  'collection-design': CollectionDesign, 'collection-grid': CollectionGrid, 'best-seller-grid': BestSellerGrid, delivery: Delivery,
};
