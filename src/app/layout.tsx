import type { Metadata } from 'next';
import { Manrope, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import GlobalPolish from '@/components/ui/GlobalPolish';

const playfair = Playfair_Display({
  variable: '--font-cormorant',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
});

// Using same variable name so all existing font-jost classes continue to work
const manrope = Manrope({
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
      <body className={`${manrope.variable} ${playfair.variable} antialiased font-jost`}>
        <GlobalPolish />
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
