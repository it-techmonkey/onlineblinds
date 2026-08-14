// One-off script: creates the six kids' Day & Night blind products in Shopify via the
// Admin API — product, images, tags, price-band metafield and collection membership.
//
// Products are created as DRAFT so they can be reviewed in Shopify admin before going
// live, but are published to every sales channel (matching the existing Day & Night
// range) so activating them is a one-click change. Note the Next.js storefront reads
// through the "Online Blinds Express Headless" publication, not "Online Store".
//
// Safe to re-run — products that already exist keep their images, tags and collections,
// but have their script-owned content (description, SEO, metafields, sales channels)
// re-synced from the data table below.
//
// Usage:
//   node scripts/create-kids-daynight-products.mjs --dry-run
//   node scripts/create-kids-daynight-products.mjs

import fs from 'node:fs';
import path from 'node:path';

const SHOPIFY_API_VERSION = '2025-01';
const IMAGE_ROOT = path.join(process.cwd(), 'new products');
const PRICE_BAND_NAME = 'Day and Night - Band C';
const PRODUCT_TYPE = 'Day & Night blinds';
const VENDOR = 'onlineblindsexpress';
const TARGET_COLLECTION_HANDLE = 'day-and-night-blinds';

// Shared across the whole Day & Night range — see the existing 60 products in the
// day-and-night-blinds collection. `day_band_c` is what maps to PRICE_BAND_NAME.
const COMMON_TAGS = ['day-and-night-blinds', 'day_night_blinds', 'day_band_c', 'sample', 'kids-blinds'];

// ============================================================================
// Product data — copy transcribed from newproducts.md
// ============================================================================

const PRODUCTS = [
  {
    handle: 'kids-alphabet-multicolour-day-and-night-blind',
    title: 'Kids Alphabet Multicolour Day & Night Blind',
    colourTags: [], // multicolour — no matching colour smart collection
    imageFolder: 'Kids Alphabet Multicolour Day & Night Blind',
    heroImage: 'LITTLE.webp',
    detailImages: ['ALPHABET.webp', 'ALPHABET (1).webp', 'ALPHABET (2).webp'],
    seoTitle: 'Kids Alphabet Multicolour Day & Night Blind | Made to Measure',
    seoDescription:
      'Colourful alphabet day and night blind for kids’ bedrooms, nurseries and playrooms. Made to measure with flexible daylight and privacy control.',
    productDetails: {
      sections: [
        {
          body: [
            'Make learning part of their everyday space with our Kids Alphabet Multicolour Day & Night Blind. Featuring a colourful alphabet design with playful animals, objects and illustrations, this fun children’s blind is a great choice for kids’ bedrooms, nurseries, playrooms and learning spaces.',
            'The cheerful ABC design combines letters with colourful pictures to create a bright, engaging window feature that children can enjoy while learning and playing. Its soft multicolour palette is easy to coordinate with a wide range of boys’, girls’ and unisex bedroom décor.',
          ],
        },
        {
          heading: 'Flexible Day & Night Light Control',
          body: [
            'Designed with alternating sheer and patterned fabric panels, this kids day and night blind gives you flexible control over daylight and privacy. Simply adjust the blind to align the fabric panels, allowing you to reduce glare, increase privacy or let more natural light into the room.',
            'It’s a practical choice for children’s rooms where lighting needs can change throughout the day — from playtime and homework to relaxing before bedtime.',
          ],
        },
        {
          heading: 'Made to Measure for Your Window',
          body: [
            'Each Kids Alphabet Multicolour Day & Night Blind is made to measure for your window, helping provide a smart, neat finish. Simply enter your required measurements when ordering and your blind will be manufactured to your selected size.',
          ],
        },
      ],
      keyFeaturesHeading: 'Why Choose Our Kids Alphabet Blind?',
      keyFeatures: [
        'Fun multicolour alphabet and educational picture design',
        'Ideal for kids’ bedrooms, nurseries and playrooms',
        'Day & night fabric for flexible light and privacy control',
        'Alternating sheer and patterned fabric panels',
        'Made to measure for your window',
        'Suitable for boys’, girls’ and unisex bedroom themes',
        'A colourful way to add character to a child’s room',
      ],
      closing:
        'Bring colour, learning and practical light control together with the Kids Alphabet Multicolour Day & Night Blind — a playful made-to-measure window blind designed especially for children’s spaces.',
    },
  },

  {
    handle: 'cloud-drift-sky-blue-kids-day-and-night-blind',
    title: 'Cloud Drift Sky Blue Kids Day & Night Blind',
    colourTags: ['blue'],
    imageFolder: 'Cloud Drift Sky Blue Kids Day & Night Blind',
    heroImage: 'CLOUD.webp',
    detailImages: ['SKY.webp', 'SKY (1).webp', 'SKY (2).webp'],
    seoTitle: 'Cloud Drift Sky Blue Kids Day & Night Blind | Made to Measure',
    seoDescription:
      'Sky blue cloud day and night blind for kids’ bedrooms and nurseries. Made to measure, with alternating sheer and patterned panels for flexible light control.',
    productDetails: {
      sections: [
        {
          body: [
            'Create a calm, dreamy space for your little one with the Cloud Drift Sky Blue Kids Day & Night Blind. Featuring a playful pattern of soft sky blue clouds across a light background, this charming children’s blind is a beautiful choice for kids’ bedrooms, nurseries and playrooms.',
            'The fresh blue cloud design brings a light and cheerful feel to the room while remaining easy to coordinate with white, grey, cream, blue and neutral children’s décor. Whether you’re decorating a new nursery or refreshing a child’s bedroom, this blue kids blind creates an eye-catching window feature with practical everyday light control.',
          ],
        },
        {
          heading: 'Flexible Day & Night Light Control',
          body: [
            'This kids day and night blind combines alternating patterned and sheer fabric panels, allowing you to easily adjust the balance between natural daylight and privacy.',
            'Position the panels to allow more daylight through the sheer sections or overlap them when you want increased privacy and reduced sun glare. The flexible design makes it ideal for a child’s bedroom, nursery or playroom, where light requirements can change throughout the day.',
          ],
        },
        {
          heading: 'Made to Measure Kids Blind',
          body: [
            'Every Cloud Drift Sky Blue Kids Day & Night Blind is made to measure for your individual window, helping create a smart, neat and tailored finish.',
            'Simply enter your required measurements when ordering and your blind will be manufactured to your selected size, providing a stylish made-to-measure children’s blind for your home.',
          ],
        },
        {
          heading: 'Perfect for Kids’ Bedrooms & Nurseries',
          body: [
            'The soft sky blue cloud pattern works beautifully with cloud, sky, dreamy and pastel bedroom themes. Its gentle design adds colour and character without overwhelming the room, making it suitable for boys’, girls’ and gender-neutral children’s spaces.',
            'It’s a great choice for parents looking for blue kids blinds, cloud blinds, nursery blinds, children’s bedroom blinds or made-to-measure day and night blinds.',
          ],
        },
      ],
      keyFeaturesHeading: 'Why Choose the Cloud Drift Sky Blue Blind?',
      keyFeatures: [
        'Playful sky blue cloud pattern',
        'Ideal for kids’ bedrooms, nurseries and playrooms',
        'Alternating sheer and patterned day & night fabric',
        'Flexible daylight and privacy control',
        'Helps reduce unwanted sun glare',
        'Made to measure for your window',
        'Suitable for boys’, girls’ and gender-neutral rooms',
        'Perfect for cloud, sky and pastel bedroom themes',
        'Complements blue, white, grey and neutral interiors',
      ],
      closing:
        'Bring a dreamy sky-inspired look to your child’s room with the Cloud Drift Sky Blue Kids Day & Night Blind — a playful made-to-measure kids blind combining beautiful cloud-patterned fabric with flexible light and privacy control.',
    },
  },

  {
    handle: 'cloud-drift-blush-pink-kids-day-and-night-blind',
    title: 'Cloud Drift Blush Pink Kids Day & Night Blind',
    colourTags: ['pink'],
    imageFolder: 'Cloud Drift Blush Pink Kids Day & Night Blind',
    heroImage: 'CLOUD.webp',
    detailImages: ['BLUSH.webp', 'BLUSH (1).webp', 'BLUSH (2).webp'],
    seoTitle: 'Cloud Drift Blush Pink Kids Day & Night Blind | Made to Measure',
    seoDescription:
      'Blush pink cloud day and night blind for kids’ bedrooms and nurseries. Made to measure, with alternating sheer and patterned panels for flexible light control.',
    productDetails: {
      sections: [
        {
          body: [
            'Create a soft, dreamy space for your little one with the Cloud Drift Blush Pink Kids Day & Night Blind. Featuring a charming pattern of fluffy blush pink clouds across a light background, this playful children’s blind is perfect for adding a gentle splash of colour to kids’ bedrooms, nurseries and playrooms.',
            'The pretty cloud design combines soft pink tones with a simple, modern look, making it easy to coordinate with pink, white, cream and neutral children’s décor. Whether you’re decorating a nursery or updating a growing child’s bedroom, this pink kids blind creates a calm and welcoming window feature.',
          ],
        },
        {
          heading: 'Flexible Day & Night Light Control',
          body: [
            'The clever day and night blind design features alternating patterned and sheer fabric panels, giving you flexible control over natural daylight and privacy.',
            'Adjust the fabric panels to allow daylight through the sheer sections or overlap them when you want increased privacy and reduced sun glare. This makes the blind a practical choice for children’s rooms throughout the day, from playtime and reading to relaxing before bedtime.',
          ],
        },
        {
          heading: 'Made to Measure Kids Blind',
          body: [
            'Every Cloud Drift Blush Pink Kids Day & Night Blind is made to measure for your individual window, helping provide a smart, neat and tailored finish.',
            'Simply enter your required measurements when ordering and your blind will be manufactured to your selected size — ideal for creating a beautifully finished window in your child’s bedroom or nursery.',
          ],
        },
        {
          heading: 'Perfect for Kids’ Bedrooms & Nurseries',
          body: [
            'With its sweet blush pink cloud pattern, this blind is particularly suited to cloud, sky, pastel and dreamy bedroom themes. The soft design adds personality without overpowering the rest of the room, making it suitable for both traditional and contemporary children\'s interiors.',
            'It’s a beautiful choice for parents searching for pink kids blinds, cloud blinds, nursery blinds or made-to-measure children’s day and night blinds.',
          ],
        },
      ],
      keyFeaturesHeading: 'Why Choose the Cloud Drift Blush Pink Blind?',
      keyFeatures: [
        'Beautiful blush pink cloud pattern',
        'Ideal for kids’ bedrooms, nurseries and playrooms',
        'Alternating sheer and patterned day & night fabric',
        'Flexible control over natural daylight and privacy',
        'Helps reduce unwanted sun glare',
        'Made to measure for your window',
        'Perfect for cloud, sky and pastel bedroom themes',
        'Complements pink, white, cream and neutral interiors',
        'Fun and stylish alternative to plain children’s blinds',
      ],
      closing:
        'Bring a little piece of the sky indoors with the Cloud Drift Blush Pink Kids Day & Night Blind — a charming made-to-measure children’s blind combining a playful cloud design with practical everyday light and privacy control.',
    },
  },

  {
    handle: 'kids-gold-star-day-and-night-blind-starry-night',
    title: 'Kids Gold Star Day & Night Blind – Starry Night',
    colourTags: ['yellow'],
    imageFolder: 'Kids Gold Star Day & Night Blind – Starry Night',
    heroImage: 'STARRY.webp',
    detailImages: ['WARM.webp', 'WARM (1).webp', 'WARM (2).webp'],
    seoTitle: 'Kids Gold Star Day & Night Blind – Starry Night | Made to Measure',
    seoDescription:
      'Gold star day and night blind for kids’ bedrooms and nurseries. Made to measure, with alternating sheer and patterned panels for flexible light and privacy.',
    productDetails: {
      sections: [
        {
          body: [
            'Add a touch of warmth and magic to your child’s room with our Kids Gold Star Day & Night Blind – Starry Night. Featuring a playful pattern of gold stars in different sizes across a soft, light background, this beautiful children’s blind is perfect for kids’ bedrooms, nurseries and playrooms.',
            'The warm gold star design creates a cheerful yet calming look that works beautifully with neutral, cream, beige and natural-toned interiors. Ideal for boys’, girls’ and gender-neutral rooms, this kids star blind is an easy way to transform a window into a fun feature.',
          ],
        },
        {
          heading: 'Flexible Day & Night Light Control',
          body: [
            'Designed with alternating patterned and sheer fabric panels, this kids day and night blind gives you flexible control over daylight and privacy throughout the day.',
            'Simply adjust the blind to change the alignment of the fabric panels. Allow natural daylight through the sheer sections when you want a brighter room, or overlap the panels for increased privacy and reduced sun glare.',
            'This makes it a practical choice for children’s bedrooms, nurseries and playrooms, where you may want different levels of light throughout the day.',
          ],
        },
        {
          heading: 'Made to Measure Kids Blind',
          body: [
            'Our Kids Gold Star Day & Night Blind is made to measure for your individual window, helping you achieve a neat, tailored finish.',
            'Simply enter your required measurements when ordering and your blind will be manufactured to your selected size, making it a stylish made-to-measure window solution for your child’s room.',
          ],
        },
        {
          heading: 'Perfect for Kids’ Bedrooms & Nurseries',
          body: [
            'The charming gold star pattern is ideal for creating a cosy star, sky or bedtime-inspired children’s bedroom. Its versatile colour scheme can complement both colourful interiors and more modern neutral nursery décor.',
            'Whether you’re decorating a new nursery, updating a child’s bedroom or creating a fun playroom, the Starry Night Gold Blind combines playful design with practical everyday light control.',
          ],
        },
      ],
      keyFeaturesHeading: 'Why Choose the Starry Night Gold Kids Blind?',
      keyFeatures: [
        'Stylish gold star patterned children’s blind',
        'Ideal for kids’ bedrooms, nurseries and playrooms',
        'Alternating sheer and patterned day & night fabric',
        'Flexible daylight and privacy control',
        'Helps reduce unwanted sun glare',
        'Made to measure for your window',
        'Suitable for boys’, girls’ and gender-neutral rooms',
        'Perfect for star, sky and bedtime-themed bedrooms',
        'Warm gold design complements neutral and modern interiors',
      ],
      closing:
        'Bring stars to their window with the Kids Gold Star Day & Night Blind – Starry Night — a fun and stylish made-to-measure kids blind designed to combine playful bedroom décor with flexible light and privacy control.',
    },
  },

  {
    handle: 'kids-blue-star-day-and-night-blind-starry-night',
    title: 'Kids Blue Star Day & Night Blind – Starry Night',
    colourTags: ['blue'],
    imageFolder: 'Kids Blue Star Day & Night Blind – Starry Night',
    heroImage: 'STARRY.webp',
    detailImages: ['WARM.webp', 'WARM (1).webp', 'WARM (2).webp'],
    seoTitle: 'Kids Blue Star Day & Night Blind – Starry Night | Made to Measure',
    seoDescription:
      'Blue star day and night blind for kids’ bedrooms and nurseries. Made to measure, with alternating sheer and patterned panels for flexible light and privacy.',
    productDetails: {
      sections: [
        {
          body: [
            'Create a dreamy and playful space with our Kids Blue Star Day & Night Blind – Starry Night. Featuring a charming pattern of blue stars in different sizes across a soft background, this stylish children’s blind is perfect for adding colour and character to a kids’ bedroom, nursery or playroom.',
            'The calming blue star design works beautifully with a wide range of children’s décor, making it an ideal choice for boys’ bedrooms, girls’ bedrooms and gender-neutral kids’ rooms. Whether you’re creating a space-themed bedroom, a relaxing nursery or simply looking for a fun star-patterned kids blind, Starry Night makes an eye-catching addition to the window.',
          ],
        },
        {
          heading: 'Day & Night Light Control',
          body: [
            'This kids day and night blind features alternating patterned and sheer fabric panels, giving you flexible control over natural daylight and privacy.',
            'Adjust the position of the fabric panels to allow more daylight through the sheer sections, or overlap the panels when you want increased privacy and reduced sun glare. It’s a practical solution for children’s rooms where lighting requirements can change throughout the day.',
          ],
        },
        {
          heading: 'Made to Measure Kids Blind',
          body: [
            'Our Kids Blue Star Day & Night Blind is made to measure for your window, providing a smart and tailored finish. Simply enter your required measurements when ordering and your blind will be manufactured to your chosen size.',
          ],
        },
        {
          heading: 'Perfect for Kids’ Bedrooms & Nurseries',
          body: [
            'The blue star pattern creates a fun yet calming look that can complement space, sky, cloud and bedtime-themed interiors. Pair it with neutral walls and soft furnishings or use it as a colourful feature in your child’s room.',
          ],
        },
      ],
      keyFeaturesHeading: 'Why Choose the Starry Night Kids Blind?',
      keyFeatures: [
        'Fun blue star patterned children’s blind',
        'Ideal for kids’ bedrooms, nurseries and playrooms',
        'Alternating sheer and patterned day & night fabric',
        'Flexible control of daylight, privacy and sun glare',
        'Made to measure for your window',
        'Suitable for boys’, girls’ and gender-neutral bedrooms',
        'Complements star, sky and space-themed children’s décor',
        'Stylish and practical alternative to plain kids blinds',
      ],
      closing:
        'Add a touch of the night sky to your little one’s room with the Kids Blue Star Day & Night Blind – Starry Night, a playful made-to-measure children’s blind combining a beautiful star design with practical day-to-day light control.',
    },
  },

  {
    handle: 'kids-garden-adventure-day-and-night-blind-little-sky',
    title: 'Kids Garden Adventure Day & Night Blind – Little Sky',
    colourTags: [], // multicolour — no matching colour smart collection
    imageFolder: 'Kids Garden Adventure Day & Night Blind – Little Sky',
    heroImage: 'LITTLE.webp',
    detailImages: ['STORY.webp', 'STORY (1).webp', 'STORY (2).webp'],
    seoTitle: 'Kids Garden Adventure Day & Night Blind – Little Sky',
    seoDescription:
      'Garden adventure day and night blind for kids’ bedrooms, nurseries and playrooms. Made to measure, with flexible daylight, glare and privacy control.',
    productDetails: {
      sections: [
        {
          body: [
            'Bring a world of outdoor adventure into your child’s room with our Kids Garden Adventure Day & Night Blind – Little Sky. Featuring a charming illustrated design of sunshine, trees, playful dogs, scooters, birds and colourful garden scenes, this children’s blind adds a fun and imaginative finishing touch to any bedroom, nursery or playroom.',
            'The soft colours and cheerful nature-inspired pattern make this kids day and night blind perfect for creating a bright, welcoming space for boys, girls and unisex children’s rooms.',
          ],
        },
        {
          heading: 'Flexible Light & Privacy Control',
          body: [
            'The clever day and night blind design combines alternating patterned and sheer fabric panels, allowing you to easily adjust the amount of daylight entering the room.',
            'Align the panels to enjoy more natural light through the sheer sections, or overlap them for increased privacy and reduced glare. This makes it a practical choice for a child’s bedroom or playroom, where light levels may need to change throughout the day.',
          ],
        },
        {
          heading: 'Made to Measure Kids Blind',
          body: [
            'Every Kids Garden Adventure Day & Night Blind is made to measure for your window, helping you achieve a neat and tailored finish. Simply enter your required measurements when ordering and your blind will be manufactured to your chosen size.',
          ],
        },
        {
          heading: 'Perfect for Children\'s Rooms',
          body: [
            'The Little Sky Garden Adventure design combines playful characters with an outdoor theme to encourage imagination while adding colour and personality to the room. It works beautifully in kids’ bedrooms, nurseries, playrooms and children\'s learning spaces.',
          ],
        },
      ],
      keyFeaturesHeading: 'Why Choose the Little Sky Garden Adventure Blind?',
      keyFeatures: [
        'Fun garden and outdoor adventure design',
        'Ideal for kids’ bedrooms, nurseries and playrooms',
        'Alternating sheer and patterned day & night panels',
        'Flexible daylight, glare and privacy control',
        'Made to measure for your window',
        'Suitable for boys’, girls’ and unisex room themes',
        'Colourful trees, sunshine, animals and playful illustrations',
        'Stylish alternative to plain children’s window blinds',
      ],
      closing:
        'Add colour, imagination and practical light control to your little one’s space with the Kids Garden Adventure Day & Night Blind – Little Sky, a playful made-to-measure children’s blind designed for modern UK homes.',
    },
  },
];

// ============================================================================
// Copy rendering
// ============================================================================

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render the full prose description for the Shopify product body from the same
 * structure the storefront renders, so the two can never drift apart.
 *
 * The page's meta description comes from the Shopify SEO description, not from
 * this body — see generateMetadata in src/app/product/[slug]/page.tsx.
 */
function buildDescriptionHtml(details) {
  const parts = [];

  for (const section of details.sections) {
    if (section.heading) parts.push(`<h3>${escapeHtml(section.heading)}</h3>`);
    for (const paragraph of section.body) parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  }

  if (details.keyFeatures?.length) {
    parts.push(`<h3>${escapeHtml(details.keyFeaturesHeading || 'Key Features')}</h3>`);
    parts.push(`<ul>${details.keyFeatures.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`);
  }

  if (details.closing) parts.push(`<p>${escapeHtml(details.closing)}</p>`);

  return parts.join('\n');
}

// ============================================================================
// Env / transport helpers (same pattern as create-installation-service-product.mjs)
// ============================================================================

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadEnv() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));
  loadEnvFile(path.join(process.cwd(), '.env'));
}

function requiredEnv(name, fallbackName) {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) {
    const names = fallbackName ? `${name} or ${fallbackName}` : name;
    throw new Error(`Missing required environment variable: ${names}`);
  }
  return value;
}

function normalizeDomain(domain) {
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

async function shopifyGraphql(url, headers, query, variables) {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify GraphQL request failed [${response.status}]: ${errorText}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

function assertNoUserErrors(label, userErrors) {
  if (userErrors?.length) {
    throw new Error(`${label} userErrors: ${JSON.stringify(userErrors)}`);
  }
}

// ============================================================================
// Queries / mutations
// ============================================================================

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      handle
      status
    }
  }
`;

const COLLECTION_BY_HANDLE_QUERY = `
  query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
    }
  }
`;

const METAFIELD_DEFINITIONS_QUERY = `
  query MetafieldDefinitions($namespace: String!, $key: String!) {
    metafieldDefinitions(first: 1, ownerType: PRODUCT, namespace: $namespace, key: $key) {
      nodes {
        id
        namespace
        key
        type {
          name
        }
      }
    }
  }
`;

const METAFIELD_DEFINITION_CREATE_MUTATION = `
  mutation MetafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCT_SET_MUTATION = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product {
        id
        handle
        title
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// productUpdate applies a partial update. productSet is declarative and resets
// anything you leave out — using it to patch an existing product silently flipped
// status back to the ACTIVE default and published the drafts to the live store.
const PRODUCT_UPDATE_MUTATION = `
  mutation ProductUpdate($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        handle
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const STAGED_UPLOADS_CREATE_MUTATION = `
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCT_CREATE_MEDIA_MUTATION = `
  mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media {
        alt
        mediaContentType
        status
      }
      mediaUserErrors {
        field
        message
      }
    }
  }
`;

const METAFIELDS_SET_MUTATION = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const COLLECTION_ADD_PRODUCTS_MUTATION = `
  mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      collection {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PUBLICATIONS_QUERY = `
  query Publications {
    publications(first: 50) {
      nodes {
        id
        name
      }
    }
  }
`;

const PUBLISHABLE_PUBLISH_MUTATION = `
  mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

// ============================================================================
// Image helpers
// ============================================================================

/** Ordered image descriptors for a product: hero first, then the bottom-bar details. */
function resolveImages(product) {
  const folder = path.join(IMAGE_ROOT, product.imageFolder);
  const files = [product.heroImage, ...product.detailImages];

  return files.map((fileName, index) => {
    const filePath = path.join(folder, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Image not found: ${filePath}`);
    }

    return {
      filePath,
      // Rename on upload so the Shopify CDN filename is meaningful.
      uploadName: `${product.handle}-${index + 1}.webp`,
      alt: index === 0 ? product.title : `${product.title} — bottom bar detail`,
    };
  });
}

/**
 * Stage an image with Shopify, POST the bytes, and return the resourceUrl that
 * productCreateMedia consumes.
 */
async function uploadImage(url, headers, image) {
  const staged = await shopifyGraphql(url, headers, STAGED_UPLOADS_CREATE_MUTATION, {
    input: [
      {
        resource: 'IMAGE',
        httpMethod: 'POST',
        mimeType: 'image/webp',
        filename: image.uploadName,
      },
    ],
  });

  assertNoUserErrors('stagedUploadsCreate', staged.stagedUploadsCreate.userErrors);

  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const parameter of target.parameters) {
    form.append(parameter.name, parameter.value);
  }
  // The file field must be appended last.
  const bytes = fs.readFileSync(image.filePath);
  form.append('file', new Blob([bytes], { type: 'image/webp' }), image.uploadName);

  const uploadResponse = await fetch(target.url, { method: 'POST', body: form });
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Image upload failed for ${image.uploadName} [${uploadResponse.status}]: ${errorText}`);
  }

  return target.resourceUrl;
}

// ============================================================================
// Main
// ============================================================================

async function ensureProductDetailsDefinition(url, headers, dryRun) {
  const existing = await shopifyGraphql(url, headers, METAFIELD_DEFINITIONS_QUERY, {
    namespace: 'custom',
    key: 'product_details',
  });

  if (existing.metafieldDefinitions.nodes.length > 0) {
    const definition = existing.metafieldDefinitions.nodes[0];
    console.log(`Metafield definition custom.product_details already exists (type: ${definition.type.name}).`);
    return;
  }

  if (dryRun) {
    console.log('Would create metafield definition custom.product_details (json, storefront PUBLIC_READ).');
    return;
  }

  const result = await shopifyGraphql(url, headers, METAFIELD_DEFINITION_CREATE_MUTATION, {
    definition: {
      name: 'Product Details',
      namespace: 'custom',
      key: 'product_details',
      description: 'Per-product marketing copy rendered in the Product Details accordion.',
      type: 'json',
      ownerType: 'PRODUCT',
      access: { storefront: 'PUBLIC_READ' },
    },
  });

  assertNoUserErrors('metafieldDefinitionCreate', result.metafieldDefinitionCreate.userErrors);
  console.log('Created metafield definition custom.product_details (json, storefront PUBLIC_READ).');
}

/**
 * Publish to every sales channel, matching the existing Day & Night range. The
 * headless storefront token is scoped to its own publication, so publishing to
 * "Online Store" alone leaves the product invisible to the Next.js app.
 *
 * publishablePublish is idempotent, so this also runs for products that already
 * exist — a re-run reconciles channels.
 */
async function publishToChannels(url, headers, productId, context) {
  if (context.publications.length === 0) return;

  const result = await shopifyGraphql(url, headers, PUBLISHABLE_PUBLISH_MUTATION, {
    id: productId,
    input: context.publications.map((publication) => ({ publicationId: publication.id })),
  });

  if (result.publishablePublish.userErrors?.length) {
    console.warn('    Publish warnings:', result.publishablePublish.userErrors);
  } else {
    console.log(`    Published to ${context.publications.length} sales channels.`);
  }
}

/**
 * Push the copy this script owns — body description, SEO and metafields. Runs on
 * create and on re-run, so editing the data table above and re-running updates
 * the live products.
 *
 * Uses productUpdate, never productSet: productSet resets every field you omit,
 * so patching this way would clobber status, tags and anything else not listed.
 */
async function syncContent(url, headers, productId, product) {
  const descriptionHtml = buildDescriptionHtml(product.productDetails);

  const updated = await shopifyGraphql(url, headers, PRODUCT_UPDATE_MUTATION, {
    product: {
      id: productId,
      descriptionHtml,
      seo: {
        title: product.seoTitle,
        description: product.seoDescription,
      },
    },
  });
  assertNoUserErrors('productUpdate', updated.productUpdate.userErrors);
  console.log(`    Synced description (${descriptionHtml.length} chars) and SEO fields.`);

  const metafieldResult = await shopifyGraphql(url, headers, METAFIELDS_SET_MUTATION, {
    metafields: [
      {
        ownerId: productId,
        namespace: 'custom',
        key: 'price_band_name',
        type: 'single_line_text_field',
        value: PRICE_BAND_NAME,
      },
      {
        ownerId: productId,
        namespace: 'custom',
        key: 'product_details',
        type: 'json',
        value: JSON.stringify(product.productDetails),
      },
    ],
  });
  assertNoUserErrors('metafieldsSet', metafieldResult.metafieldsSet.userErrors);
  console.log(`    Set custom.price_band_name = "${PRICE_BAND_NAME}" and custom.product_details.`);
}

async function createProduct(url, headers, product, context) {
  const existing = await shopifyGraphql(url, headers, PRODUCT_BY_HANDLE_QUERY, {
    handle: product.handle,
  });

  const images = resolveImages(product);
  const tags = [...COMMON_TAGS, ...product.colourTags];
  const descriptionHtml = buildDescriptionHtml(product.productDetails);

  if (context.dryRun) {
    const details = product.productDetails;
    console.log(`  Would ${existing.productByHandle ? 'update' : 'create'} "${product.title}"`);
    console.log(`    handle:      ${product.handle}`);
    if (!existing.productByHandle) {
      console.log(`    status:      DRAFT`);
      console.log(`    productType: ${PRODUCT_TYPE}`);
      console.log(`    vendor:      ${VENDOR}`);
      console.log(`    tags:        ${tags.join(', ')}`);
      console.log(`    collection:  ${TARGET_COLLECTION_HANDLE}`);
      for (const image of images) {
        console.log(`    image:       ${path.basename(image.filePath)} -> ${image.uploadName}`);
      }
    }
    console.log(`    priceBand:   ${PRICE_BAND_NAME}`);
    console.log(`    seoTitle:    ${product.seoTitle} (${product.seoTitle.length} chars)`);
    console.log(`    seoDesc:     ${product.seoDescription.length} chars`);
    console.log(`    bodyHtml:    ${descriptionHtml.length} chars`);
    console.log(
      `    details:     ${details.sections.length} sections, ${details.keyFeatures.length} key features, closing: ${Boolean(details.closing)}`
    );
    return;
  }

  if (existing.productByHandle) {
    console.log(`  Exists — ${existing.productByHandle.id}; re-syncing content.`);
    await syncContent(url, headers, existing.productByHandle.id, product);
    await publishToChannels(url, headers, existing.productByHandle.id, context);
    return;
  }

  const created = await shopifyGraphql(url, headers, PRODUCT_SET_MUTATION, {
    input: {
      title: product.title,
      handle: product.handle,
      status: 'DRAFT',
      productType: PRODUCT_TYPE,
      vendor: VENDOR,
      tags,
    },
  });

  assertNoUserErrors('productSet', created.productSet.userErrors);
  const productId = created.productSet.product.id;
  console.log(`  Created "${product.title}" (${productId}).`);

  const media = [];
  for (const image of images) {
    const resourceUrl = await uploadImage(url, headers, image);
    media.push({
      originalSource: resourceUrl,
      alt: image.alt,
      mediaContentType: 'IMAGE',
    });
  }

  const mediaResult = await shopifyGraphql(url, headers, PRODUCT_CREATE_MEDIA_MUTATION, {
    productId,
    media,
  });
  assertNoUserErrors('productCreateMedia', mediaResult.productCreateMedia.mediaUserErrors);
  console.log(`    Attached ${media.length} images (hero: ${path.basename(images[0].filePath)}).`);

  await syncContent(url, headers, productId, product);

  const collectionResult = await shopifyGraphql(url, headers, COLLECTION_ADD_PRODUCTS_MUTATION, {
    id: context.collectionId,
    productIds: [productId],
  });
  assertNoUserErrors('collectionAddProducts', collectionResult.collectionAddProducts.userErrors);
  console.log(`    Added to the ${TARGET_COLLECTION_HANDLE} collection.`);

  await publishToChannels(url, headers, productId, context);
}

async function main() {
  loadEnv();

  const dryRun = process.argv.includes('--dry-run');

  const storeDomain = normalizeDomain(
    requiredEnv('SHOPIFY_STORE_DOMAIN', 'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN')
  );
  const adminToken = requiredEnv('SHOPIFY_ADMIN_ACCESS_TOKEN');
  const url = `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': adminToken,
  };

  console.log(dryRun ? 'DRY RUN — no changes will be made.\n' : `Store: ${storeDomain}\n`);

  await ensureProductDetailsDefinition(url, headers, dryRun);

  const collectionData = await shopifyGraphql(url, headers, COLLECTION_BY_HANDLE_QUERY, {
    handle: TARGET_COLLECTION_HANDLE,
  });
  if (!collectionData.collectionByHandle) {
    throw new Error(`Collection "${TARGET_COLLECTION_HANDLE}" not found.`);
  }
  console.log(
    `Target collection: ${collectionData.collectionByHandle.title} (${collectionData.collectionByHandle.id})\n`
  );

  const publicationData = await shopifyGraphql(url, headers, PUBLICATIONS_QUERY, {});
  const publications = publicationData.publications.nodes;
  console.log(`Sales channels: ${publications.map((node) => node.name).join(', ')}\n`);

  const context = {
    dryRun,
    collectionId: collectionData.collectionByHandle.id,
    publications,
  };

  for (const [index, product] of PRODUCTS.entries()) {
    console.log(`[${index + 1}/${PRODUCTS.length}] ${product.title}`);
    await createProduct(url, headers, product, context);
  }

  console.log(
    dryRun
      ? '\nDry run complete.'
      : '\nDone. Products are DRAFT — review them in Shopify admin, then set status to ACTIVE.'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
