// Navigation Data Structure
// Each category has its own unique slug at /collections/[slug]

export interface NavigationBadge {
  label: string;
  variant: 'trending' | 'bestseller';
}

export interface NavigationLink {
  label: string;
  href?: string;
  icon?: string;
  badge?: NavigationBadge;
}

export interface NavigationItem {
  label: string;
  href?: string;
  submenu?: NavigationLink[];
}

export interface CustomCollectionFilter {
  tagsAny?: string[];
  tagsAll?: string[];
  categorySlugsAny?: string[];
  categorySlugsAll?: string[];
  productSlugsAny?: string[];
}

const TRENDING_BADGE: NavigationBadge = { label: 'Trending', variant: 'trending' };
const BESTSELLER_BADGE: NavigationBadge = { label: 'Bestseller', variant: 'bestseller' };

// Navigation data - used by Header component
export const navigationData: NavigationItem[] = [
  {
    label: 'Blinds by Style',
    submenu: [
      { label: 'Roller Blinds', href: '/collections/roller-blinds', icon: '/nav-icons/roller-blinds.webp' },
      { label: 'Day & Night Blinds', href: '/collections/day-and-night-blinds', icon: '/nav-icons/day-night-blinds.webp' },
      { label: 'Roman Blinds', href: '/collections/roman-blinds', icon: '/nav-icons/roman-blinds.webp' },
      { label: 'Vertical Blinds', href: '/collections/vertical-blinds', icon: '/nav-icons/vertical-blinds.webp' },
      { label: 'Replacement Vertical Blinds Slat', href: '/collections/replacement-vertical-blinds-slat', icon: '/nav-icons/vertical-blinds.webp' },
      { label: 'Metal Venetian Blinds', href: '/collections/metal-venetian-blind', icon: '/nav-icons/venetian-blinds.webp' },
      { label: 'Faux Wooden Blinds', href: '/collections/faux-wooden-blinds', icon: '/nav-icons/wooden-blinds.webp' },
      { label: 'Skylight Blinds', href: '/collections/skylight-blinds', icon: '/nav-icons/skylight-blinds.webp' },
      { label: 'Easy Stick', href: '/collections/easy-stick-blinds', icon: '/nav-icons/no-drill-rollers.webp', badge: TRENDING_BADGE },
      { label: 'No Drill Blinds', href: '/collections/no-drill-blinds', icon: '/nav-icons/no-drill-blinds.svg' },
      { label: 'Complete Blackout Blinds', href: '/product/non-driii-honeycomb-blackout-blinds', icon: '/nav-icons/pleated-blind.webp', badge: TRENDING_BADGE },
    ],
  },
  {
    label: 'Motorised',
    submenu: [
      { label: 'Motorised Roller Blinds', href: '/collections/motorised-roller-shades', icon: '/nav-icons/roller-blinds.webp' },
      { label: 'Motorised Day & Night Blinds', href: '/collections/motorised-dual-zebra-shades', icon: '/nav-icons/day-night-blinds.webp' },
    ],
  },
  {
    label: 'No Drill & Perfect Fit',
    submenu: [
      { label: 'No Drill Blinds', href: '/collections/no-drill-blinds', icon: '/nav-icons/no-drill-blinds.svg' },
      { label: 'Easy Stick', href: '/collections/easy-stick-blinds', icon: '/nav-icons/no-drill-rollers.webp', badge: TRENDING_BADGE },
      { label: 'Perfect Fit Metal', href: '/collections/perfect-fit-metal', icon: '/nav-icons/metal-blinds.webp' },
      { label: 'Perfect Fit Wooden', href: '/collections/perfect-fit-wooden', icon: '/nav-icons/light-wood.webp' },
      { label: 'Perfect Fit Shutter Blind', href: '/product/sierra-ice-white-perfect-fit-shutter-blind', icon: '/nav-icons/shutter-blind.webp', badge: BESTSELLER_BADGE },
      { label: 'Perfect Fit - Honeycomb', href: '/product/non-driii-honeycomb-blackout-blinds', icon: '/nav-icons/pleated-blind.webp' },
    ],
  },
  {
    label: 'Shop by Feature',
    submenu: [
      { label: 'Blackout Blinds', href: '/collections/blackout-blinds', icon: '/nav-icons/blackout-blinds.svg' },
      { label: 'Light Filtering Blinds', href: '/collections/light-filtering-blinds', icon: '/nav-icons/roller-blinds.webp' },
      { label: 'Waterproof Blinds', href: '/collections/waterproof-blinds', icon: '/nav-icons/waterproof-blinds.svg' },
      { label: 'Motorised Blinds', href: '/collections/motorised-blinds', icon: '/nav-icons/cordless-blinds.svg' },
      { label: 'No Drill Blinds', href: '/collections/no-drill-blinds', icon: '/nav-icons/no-drill-blinds.svg' },
      { label: 'Perfect Fit Blinds', href: '/collections/perfect-fit-blinds', icon: '/nav-icons/shutter-blind.webp' },
    ],
  },
  {
    label: 'Shop All',
    href: '/collections',
  },
  {
    label: 'Guides',
    href: '/guides',
  },
  {
    label: 'About',
    href: '/about',
  },
];

// Collection slugs from navigation (for static generation)
export const ALL_COLLECTION_SLUGS = [
  // Base category pages
  'vertical-blinds',
  'replacement-vertical-blinds-slat',
  'roller-blinds',
  'day-and-night-blinds',
  'roman-blinds',
  'metal-venetian-blind',
  'faux-wooden-blinds',
  'easy-stick-blinds',
  'no-drill-blinds',
  'skylight-blinds',
  'perfect-fit-metal',
  'perfect-fit-wooden',
  'perfect-fit-shutter',
  'eclipsecore-shades',

  // Motorised category pages
  'motorised-roller-shades',
  'motorised-dual-zebra-shades',
  'motorised-eclipsecore',
  'motorised-blinds',

  // Feature pages
  'blackout-blinds',
  'light-filtering-blinds',
  'waterproof-blinds',
  'perfect-fit-blinds',

  // Legacy / compatibility pages
  'light-filtering-vertical-blinds',
  'blackout-vertical-blinds',
  'waterproof-blackout-vertical-blinds',
  'light-filtering-roller-shades',
  'blackout-roller-shades',
  'waterproof-blackout-roller-shades',
  'blackout-roller-shades-category',
  'blackout-dual-zebra-shades',
  'blackout-vertical-blinds-category',
  'shop-by-feature',
  'shop-by-room',
];

// Custom descriptions for collection hero sections
export const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  'vertical-blinds': 'Explore our full range of made-to-measure vertical blinds, including light filtering, blackout, and waterproof options designed for smooth light control and a clean modern finish.',
  'replacement-vertical-blinds-slat': 'Shop made-to-measure replacement vertical blind slats with simple height-based pricing and bottom weight or chain options to refresh existing vertical blinds.',
  'roller-blinds': 'Browse our complete collection of made-to-measure roller blinds, including light filtering, blackout, and waterproof styles crafted for clean lines, privacy, and everyday ease.',
  'day-and-night-blinds': 'Versatile day and night blinds offering flexible light control and modern style. Custom made to measure with premium materials for the perfect window covering.',
  'roman-blinds': 'Discover our Roman blinds collection with elegant fabrics, lining options, and made-to-measure sizing for a soft tailored finish.',
  'metal-venetian-blind': 'Browse sleek made-to-measure metal venetian blinds designed for crisp light control, easy maintenance, and a smart modern look.',
  'faux-wooden-blinds': 'Discover made-to-measure faux wooden blinds with installation choices and toggle upgrades, including Aquawood and Expressions styles priced from dedicated faux-wood bands.',
  'easy-stick-blinds': 'Explore the Easy Stick collection with glass-fit honeycomb, metal venetian, and wood venetian styles designed for quick stick-on installation and streamlined made-to-measure pricing.',
  'no-drill-blinds': 'Discover made-to-measure no drill blinds designed for quick tool-free installation, clean inside-recess fitting, and simple left or right control options.',
  'skylight-blinds': 'Browse our skylight blinds collection with simple base pricing, brand-specific blind type options, and a made-to-measure finish tailored for roof windows.',
  'perfect-fit-metal': 'Browse made-to-measure Perfect Fit Metal blinds with glass-size measurement, left or right control, selected frame-colour upgrades, and bracket-size options for a neat no-drill installation.',
  'perfect-fit-wooden': 'Shop made-to-measure Perfect Fit Wooden blinds with glass-size measurement, control-side selection, frame-colour upgrades, and bracket-size options for a clean no-drill finish.',
  'perfect-fit-shutter': 'Shop our Perfect Fit Shutter Blind with made-to-measure sizing, handle-position support, and a clean no-drill clip-on installation.',
  'eclipsecore-shades': 'Discover our Complete Blackout Blinds with honeycomb construction, strong blackout performance, and no-drill style installation for modern windows.',
  'motorised-roller-shades': 'Convenient motorised roller blinds with smooth remote-controlled operation. Custom sized with durable materials for effortless light control and modern design in any room.',
  'motorised-dual-zebra-shades': 'Stylish motorised day and night blinds combining flexible light control with remote operation. Custom made to measure for a perfect fit in any contemporary home.',
  'motorised-blinds': 'Explore our motorised blinds collection for remote-controlled convenience across roller, day and night, and other easy-living window covering styles.',
  'blackout-blinds': 'Shop blackout blinds across our collections for stronger privacy, reduced light intrusion, and a more restful feel in bedrooms and media spaces.',
  'light-filtering-blinds': 'Explore light filtering blinds that soften sunlight while keeping rooms bright, comfortable, and private throughout the day.',
  'waterproof-blinds': 'Browse waterproof blinds suited to moisture-prone rooms where wipe-clean performance and reliable privacy both matter.',
  'perfect-fit-blinds': 'Browse our Perfect Fit blinds collection, including metal, wooden, shutter, and honeycomb options made for a clean fitted finish.',

  // Legacy / compatibility pages
  'light-filtering-vertical-blinds': 'Custom made-to-measure light filtering vertical blinds that softly diffuse natural light while maintaining privacy.',
  'blackout-vertical-blinds': 'Made-to-measure blackout vertical blinds providing complete privacy, light control, and modern style.',
  'waterproof-blackout-vertical-blinds': 'Durable waterproof blackout vertical blinds crafted from premium PVC soft fabric with 89mm slats.',
  'light-filtering-roller-shades': 'Elegant light filtering roller shades that soften sunlight while maintaining natural brightness and privacy.',
  'blackout-roller-shades': 'Stylish blackout roller shades designed to block sunlight, improve privacy, and enhance comfort.',
  'waterproof-blackout-roller-shades': 'Durable waterproof blackout roller shades ideal for moisture-prone environments.',
  'blackout-roller-shades-category': 'Stylish blackout roller shades designed to block sunlight, improve privacy, and enhance comfort.',
  'blackout-dual-zebra-shades': 'Blackout day and night blinds combining layered styling with stronger light blocking and privacy.',
  'blackout-vertical-blinds-category': 'Made-to-measure blackout vertical blinds providing complete privacy, light control, and modern style.',
};

// Display names for collection slugs (used when category not in backend)
export const COLLECTION_DISPLAY_NAMES: Record<string, string> = {
  'vertical-blinds': 'Vertical Blinds',
  'replacement-vertical-blinds-slat': 'Replacement Vertical Blinds Slat',
  'roller-blinds': 'Roller Blinds',
  'day-and-night-blinds': 'Day & Night Blinds',
  'roman-blinds': 'Roman Blinds',
  'metal-venetian-blind': 'Metal Venetian Blinds',
  'faux-wooden-blinds': 'Faux Wooden Blinds',
  'easy-stick-blinds': 'Easy Stick',
  'no-drill-blinds': 'No Drill Blinds',
  'skylight-blinds': 'Skylight Blinds',
  'perfect-fit-metal': 'Perfect Fit Metal',
  'perfect-fit-wooden': 'Perfect Fit Wooden',
  'perfect-fit-shutter': 'Perfect Fit Shutter Blind',
  'eclipsecore-shades': 'Complete Blackout Blinds',
  'motorised-roller-shades': 'Motorised Roller Blinds',
  'motorised-dual-zebra-shades': 'Motorised Day & Night Blinds',
  'motorised-eclipsecore': 'Motorised Complete Blackout Blinds',
  'motorised-blinds': 'Motorised Blinds',
  'blackout-blinds': 'Blackout Blinds',
  'light-filtering-blinds': 'Light Filtering Blinds',
  'waterproof-blinds': 'Waterproof Blinds',
  'perfect-fit-blinds': 'Perfect Fit Blinds',

  // Legacy / compatibility pages
  'light-filtering-vertical-blinds': 'Light Filtering Vertical Blinds',
  'blackout-vertical-blinds': 'Blackout Vertical Blinds',
  'waterproof-blackout-vertical-blinds': 'Waterproof Blackout Vertical Blinds',
  'light-filtering-roller-shades': 'Light Filtering Roller Blinds',
  'blackout-roller-shades': 'Blackout Roller Blinds',
  'waterproof-blackout-roller-shades': 'Waterproof Blackout Roller Blinds',
  'blackout-roller-shades-category': 'Blackout Roller Blinds',
  'blackout-dual-zebra-shades': 'Blackout Day & Night Blinds',
  'blackout-vertical-blinds-category': 'Blackout Vertical Blinds',
  'shop-by-feature': 'Shop by Feature',
  'shop-by-room': 'Shop by Room',
};

// Mapping of custom navigation slugs to their backend collection slugs
// This allows custom page titles while fetching products from existing collections
export const NAVIGATION_SLUG_MAPPING: Record<string, string> = {
  // Legacy navigation slugs
  'light-filtering-vertical-blinds': 'vertical-blinds',
  'blackout-vertical-blinds': 'vertical-blinds',
  'waterproof-blackout-vertical-blinds': 'vertical-blinds',
  'light-filtering-roller-shades': 'roller-blinds',
  'blackout-roller-shades': 'roller-blinds',
  'waterproof-blackout-roller-shades': 'roller-blinds',
  'motorised-roller-shades': 'motorized-blinds',
  'motorised-dual-zebra-shades': 'motorized-blinds',
  'motorised-eclipsecore': 'pleated-blinds',
  'blackout-roller-shades-category': 'roller-blinds',
  'blackout-dual-zebra-shades': 'day-and-night-blinds',
  'blackout-vertical-blinds-category': 'vertical-blinds',
  'eclipsecore-shades': 'pleated-blinds',
  'shop-by-feature': 'roller-blinds',
  'shop-by-room': 'roller-blinds',
};

// Mapping of navigation slugs to required tags for filtering
// Products must have ALL specified tags to appear on these legacy pages
export const NAVIGATION_TAG_FILTERS: Record<string, string[]> = {
  'light-filtering-vertical-blinds': ['light-filtering'],
  'blackout-vertical-blinds': ['blackout'],
  'waterproof-blackout-vertical-blinds': ['waterproof', 'blackout'],
  'light-filtering-roller-shades': ['light-filtering'],
  'blackout-roller-shades': ['blackout'],
  'waterproof-blackout-roller-shades': ['waterproof', 'blackout'],
  'blackout-roller-shades-category': ['blackout'],
  'blackout-dual-zebra-shades': ['blackout'],
  'blackout-vertical-blinds-category': ['blackout'],
  'motorised-roller-shades': ['roller-blinds-electrical'],
  'motorised-dual-zebra-shades': ['day-and-night-blinds-electrical'],
  'day-and-night-blinds': [],
  'eclipsecore-shades': [],
};

// Mapping of navigation slugs to required secondary categories for filtering
export const NAVIGATION_CATEGORY_FILTERS: Record<string, string[]> = {
  // motorised-eclipsecore intentionally omitted — shows all EclipseCore products with motorization pre-selected
};

// Custom aggregate collection pages backed by global product filtering
export const CUSTOM_COLLECTION_FILTERS: Record<string, CustomCollectionFilter> = {
  'blackout-blinds': {
    tagsAny: ['blackout'],
    productSlugsAny: ['non-driii-honeycomb-blackout-blinds'],
  },
  'light-filtering-blinds': {
    tagsAny: ['light-filtering'],
  },
  'waterproof-blinds': {
    tagsAny: ['waterproof'],
  },
  'motorised-blinds': {
    categorySlugsAny: ['motorized-blinds'],
  },
  'perfect-fit-blinds': {
    categorySlugsAny: ['perfect-fit-metal', 'perfect-fit-wooden', 'perfect-fit-shutter', 'eclipsecore-shades'],
  },
};
