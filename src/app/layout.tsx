import type { Metadata } from 'next';
import Script from 'next/script';
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
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5KVNBLSF');`,
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${lora.variable} antialiased font-jost`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5KVNBLSF"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

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
