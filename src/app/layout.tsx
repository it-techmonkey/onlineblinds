import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Online Blinds - Custom Blinds Made to Measure',
  description: 'Discover custom blinds and shades designed for your space and lifestyle, crafted for beauty, and built to last.',
  icons: {
    icon: '/icons/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jost.variable} ${cormorant.variable} antialiased font-jost`}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
