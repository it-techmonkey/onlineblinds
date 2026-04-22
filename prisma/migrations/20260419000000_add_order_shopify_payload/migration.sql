-- Store the paid Shopify order identifier and normalized configured line items.
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "shopifyOrderId" TEXT,
ADD COLUMN IF NOT EXISTS "lineItems" JSONB,
ADD COLUMN IF NOT EXISTS "currencyCode" TEXT DEFAULT 'GBP';

CREATE UNIQUE INDEX IF NOT EXISTS "Order_shopifyOrderId_key" ON "Order"("shopifyOrderId");
CREATE INDEX IF NOT EXISTS "Order_shopifyOrderId_idx" ON "Order"("shopifyOrderId");
