import type { Metadata } from 'next';
import { DM_Sans, Lora } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import GlobalPolish from '@/components/ui/GlobalPolish';
import ShopifyAnalytics from '@/components/analytics/ShopifyAnalytics';
import AnnouncementBar from '@/components/layout/AnnouncementBar';

const lora = Lora({
  variable: '--font-cormorant',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  style: ['normal', 'italic'],
});

// Using same variable name so all existing font-jost classes continue to work
const dmSans = DM_Sans({
  variable: '--font-jost',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Online Blinds - Custom Blinds Made to Measure',
  description: 'Discover custom blinds and shades designed for your space and lifestyle, crafted for beauty, and built to last.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${lora.variable} antialiased font-jost`}>
        <GlobalPolish />
        <Suspense fallback={null}>
          <ShopifyAnalytics />
        </Suspense>
        <AnnouncementBar />
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
