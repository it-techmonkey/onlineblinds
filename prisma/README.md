# Prisma Schema Documentation

## Overview
This schema defines the database structure for YourNextBlinds e-commerce platform, focusing on products and their customization options.

## Core Models

### Product System
- **Product**: Main product entity with pricing, stock status, and delivery info
- **ProductImage**: Multiple images per product with ordering
- **Category**: Product categories (Vertical Blinds, Roller Blinds, etc.)
- **Tag**: Searchable tags for products
- **ProductCategory**: Many-to-many relationship between products and categories
- **ProductTag**: Many-to-many relationship between products and tags

### Customization System
- **Customization**: Root customization types (e.g., "Headrail", "Bottom Weight Chain")
- **CustomizationOption**: Individual values with pricing (e.g., "Classic Headrail +£0", "Platinum Headrail +£50")
- **ProductCustomization**: Links products to their available customizations

### Review System
- **Review**: Customer reviews with rating, content, and verification status

## Key Features

### 1. Nested Customizations
`CustomizationOption` supports parent-child relationships via `parentOptionId`:

```typescript
// Example: Headrail → Color selection
Headrail (Customization)
  ├─ Classic Headrail (CustomizationOption, price: £0)
  │   ├─ White (CustomizationOption, parentOptionId: Classic Headrail ID)
  │   └─ Black (CustomizationOption, parentOptionId: Classic Headrail ID)
  └─ Platinum Headrail (CustomizationOption, price: £50)
      ├─ Silver (CustomizationOption, parentOptionId: Platinum Headrail ID)
      └─ Gold (CustomizationOption, parentOptionId: Platinum Headrail ID)
```

### 2. Flexible Pricing
Each `CustomizationOption` has:
- `price`: Decimal value
- `priceType`: FIXED, PERCENTAGE, or FREE

### 3. Product-Specific Customizations
`ProductCustomization` allows:
- Different products to have different customization options
- Product-specific required/optional flags
- Custom ordering per product

## Setup Instructions

### 1. Install Dependencies
```bash
npm install prisma @prisma/client
npm install -D prisma
```

### 2. Configure Database
Copy `.env.example` to `.env` and update `DATABASE_URL`:
```bash
cp .env.example .env
```

### 3. Initialize Prisma
```bash
npx prisma generate
```

### 4. Create Database & Tables
```bash
npx prisma db push
```

Or with migrations:
```bash
npx prisma migrate dev --name init
```

### 5. Seed Database (Optional)
Create `prisma/seed.ts` and run:
```bash
npx prisma db seed
```

## Usage Examples

### Query Products with Customizations
```typescript
const product = await prisma.product.findUnique({
  where: { slug: 'pacific-white' },
  include: {
    images: { orderBy: { position: 'asc' } },
    categories: { include: { category: true } },
    productCustomizations: {
      include: {
        customization: {
          include: {
            options: {
              where: { isAvailable: true },
              orderBy: { position: 'asc' },
              include: {
                childOptions: true // Nested options
              }
            }
          }
        }
      }
    },
    reviews: {
      where: { isApproved: true },
      orderBy: { createdAt: 'desc' }
    }
  }
});
```

### Create Product with Customizations
```typescript
const product = await prisma.product.create({
  data: {
    name: "Pacific White Vertical Blind",
    slug: "pacific-white",
    price: 124.00,
    originalPrice: 200.00,
    images: {
      create: [
        { url: "/images/pacific-white-1.jpg", position: 0 },
        { url: "/images/pacific-white-2.jpg", position: 1 }
      ]
    },
    productCustomizations: {
      create: [
        { customizationId: "headrail-customization-id", isRequired: true }
      ]
    }
  }
});
```

### Query Nested Customizations
```typescript
const headrailOptions = await prisma.customizationOption.findMany({
  where: {
    customizationId: 'headrail-id',
    parentOptionId: null // Root level only
  },
  include: {
    childOptions: { // Nested options
      where: { isAvailable: true },
      orderBy: { position: 'asc' }
    }
  }
});
```

## Database Management

### View Database in Prisma Studio
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

### Generate Prisma Client
```bash
npx prisma generate
```

## Enums

### StockStatus
- `IN_STOCK`: Product available
- `OUT_OF_STOCK`: Product unavailable
- `LOW_STOCK`: Limited quantity
- `PRE_ORDER`: Available for pre-order
- `DISCONTINUED`: No longer sold

### CustomizationType
- `SELECTOR`: Radio/Image selector (e.g., Headrail)
- `DROPDOWN`: Dropdown menu
- `SIZE_INPUT`: Width/Height inputs
- `COLOR_PICKER`: Color selection
- `TEXT_INPUT`: Custom text
- `CHECKBOX`: Multiple selection

### PriceType
- `FIXED`: Fixed additional price (e.g., +£50)
- `PERCENTAGE`: Percentage of base price (e.g., +10%)
- `FREE`: No additional cost

## Next Steps

1. Create seed data from `dataset.json`
2. Implement Prisma queries in API routes
3. Add indexes for performance optimization
4. Set up database backups
5. Configure connection pooling for production
