# Database Schema Relationships

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCT SYSTEM                              │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   Product    │
    │──────────────│
    │ id           │
    │ slug         │──┐
    │ name         │  │
    │ price        │  │
    │ stockStatus  │  │
    └──────────────┘  │
           │          │
           │ 1        │
           │          │
           │ *        │
    ┌──────┴──────┐  │
    │ProductImage │  │
    │─────────────│  │
    │ url         │  │
    │ position    │  │
    └─────────────┘  │
                     │
           ┌─────────┴─────────┐
           │                   │
           │ *                 │ *
    ┌──────┴──────────┐ ┌─────┴─────────┐
    │ProductCategory  │ │  ProductTag   │
    │─────────────────│ │───────────────│
    │ productId       │ │ productId     │
    │ categoryId      │ │ tagId         │
    └─────────┬───────┘ └───────┬───────┘
              │                 │
              │ *               │ *
              │ 1               │ 1
    ┌─────────┴───────┐ ┌───────┴───────┐
    │   Category      │ │     Tag       │
    │─────────────────│ │───────────────│
    │ name            │ │ name          │
    │ slug            │ │ slug          │
    └─────────────────┘ └───────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                     CUSTOMIZATION SYSTEM                            │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │   Product        │
    └────────┬─────────┘
             │
             │ 1
             │
             │ *
    ┌────────┴──────────────┐
    │ProductCustomization   │
    │───────────────────────│
    │ productId             │
    │ customizationId       │
    │ isRequired            │
    └───────────┬───────────┘
                │
                │ *
                │ 1
    ┌───────────┴───────────┐
    │   Customization       │
    │───────────────────────│
    │ name (e.g. Headrail)  │
    │ label                 │
    │ type                  │
    └───────────┬───────────┘
                │
                │ 1
                │
                │ *
    ┌───────────┴────────────────┐
    │  CustomizationOption       │
    │────────────────────────────│
    │ name                       │
    │ price (£0, £50, etc.)      │
    │ priceType                  │
    │ parentOptionId (NULLABLE)  │─┐
    └────────────────────────────┘ │
                 ▲                 │
                 │                 │
                 └─────────────────┘
                   Self-referencing
                   for nesting


┌─────────────────────────────────────────────────────────────────────┐
│                         REVIEW SYSTEM                               │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   Product    │
    └──────┬───────┘
           │
           │ 1
           │
           │ *
    ┌──────┴──────┐
    │   Review    │
    │─────────────│
    │ author      │
    │ rating      │
    │ content     │
    │ isApproved  │
    └─────────────┘
```

## Example: Nested Customization Structure

```
Product: "Pacific White Vertical Blind"
│
└─── ProductCustomization (links Product to Customization)
     │
     └─── Customization: "Headrail"
          │
          ├─── CustomizationOption: "Louvres/Slats Only"
          │    │ price: £0
          │    │ parentOptionId: null (root level)
          │    │
          │    └─── (No child options)
          │
          ├─── CustomizationOption: "Classic Headrail"
          │    │ price: £25
          │    │ parentOptionId: null (root level)
          │    │
          │    ├─── CustomizationOption: "White"
          │    │    │ price: £0
          │    │    │ parentOptionId: "Classic Headrail" ID
          │    │
          │    └─── CustomizationOption: "Black"
          │         │ price: £5
          │         │ parentOptionId: "Classic Headrail" ID
          │
          └─── CustomizationOption: "Platinum Headrail"
               │ price: £50
               │ parentOptionId: null (root level)
               │
               ├─── CustomizationOption: "Silver"
               │    │ price: £10
               │    │ parentOptionId: "Platinum Headrail" ID
               │
               └─── CustomizationOption: "Gold"
                    │ price: £20
                    │ parentOptionId: "Platinum Headrail" ID
```

## Pricing Calculation Example

```typescript
// Base product price
const basePrice = 124.00;

// User selections:
// - Headrail: "Platinum Headrail" (+£50)
// - Color: "Gold" (+£20)
// - Bottom Chain: "Premium" (+£15)

const totalPrice = basePrice + 50 + 20 + 15; // £209
```

## Key Relationships Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| Product ↔ ProductImage | 1:N | One product has many images |
| Product ↔ Category | N:M | Products belong to multiple categories |
| Product ↔ Tag | N:M | Products have multiple tags |
| Product ↔ Review | 1:N | One product has many reviews |
| Product ↔ Customization | N:M | Products have multiple customization options |
| Customization ↔ CustomizationOption | 1:N | One customization type has many values |
| CustomizationOption ↔ CustomizationOption | Self-referencing | Options can have child options (nesting) |
