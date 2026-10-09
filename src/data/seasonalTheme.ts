// Halloween sale presentation. Flip HALLOWEEN_ENABLED to turn every Halloween
// change on the site on or off — nothing else needs editing.
//
// This is presentation only: the offers themselves (up to 60% off, the FINAL10
// code, £20 off a first order) are the standing ones and are not changed here.

export const HALLOWEEN_ENABLED = true;

export const halloween = {
  // Countdown target: midnight at the end of 31 October, UK time (GMT by then).
  // Once it passes, the countdown and "ends" label are hidden; everything else
  // stays until HALLOWEEN_ENABLED is switched off.
  endsAt: '2026-11-01T00:00:00Z',
  endsLabel: 'Ends 31 Oct',

  announcement: {
    headline: 'Halloween Sale: Up to 60% Off',
    headlineMobile: 'Halloween Sale · Up to 60% Off',
  },

  // Each slide falls back to the regular banner until its Halloween image is
  // added to public/home/hero/halloween/.
  heroSlides: [
    {
      src: '/home/hero/halloween/hero-halloween-1.webp',
      fallbackSrc: '/home/hero/hero-img1.webp',
      alt: 'Halloween Sale on Premium Vertical Blinds',
      eyebrow: 'Halloween Sale · Up to 60% Off',
      title: 'Premium\nVertical Blinds',
      buttonText: 'Shop Vertical Blinds',
      href: '/collections/light-filtering-vertical-blinds',
    },
    {
      src: '/home/hero/halloween/hero-halloween-2.webp',
      fallbackSrc: '/home/hero/hero-img2.webp',
      alt: 'Halloween Sale on Blackout Roller Shades',
      eyebrow: 'Spooky-dark nights, cosy rooms',
      title: 'Blackout\nRoller Shades',
      buttonText: 'Shop Roller Shades',
      href: '/collections/blackout-roller-shades',
    },
    {
      src: '/home/hero/halloween/hero-halloween-3.webp',
      fallbackSrc: '/home/hero/hero-img3.webp',
      alt: 'Halloween Sale on Day and Night Blinds',
      eyebrow: 'No tricks, just light control',
      title: 'Day and Night\nBlinds',
      buttonText: 'Shop Day and Night Blinds',
      href: '/collections/day-and-night-blinds',
    },
  ],

  bestSellers: {
    eyebrow: 'Halloween Sale',
    heading: 'Frightfully Good Best Sellers',
  },

  emailCapture: {
    badge: 'Halloween Treat',
    heading: 'No Tricks, Just £20 Off Your First Order',
  },

  productCardTag: 'Halloween Deal',
  urgencyLabel: 'Halloween Sale ends in',
  categoryChip: 'Halloween Sale · Up to 60% Off',
  cartHint: 'Halloween Sale: use code FINAL10 for an extra 10% off.',
};

export function getHalloweenSecondsLeft() {
  return Math.max(0, Math.floor((new Date(halloween.endsAt).getTime() - Date.now()) / 1000));
}
