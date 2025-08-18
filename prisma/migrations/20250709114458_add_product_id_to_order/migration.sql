-- Add the column with a default value (e.g., 0 or NULL with NOT NULL later)
ALTER TABLE "Order" ADD COLUMN "productId" INTEGER;

-- Optionally, update existing rows with a default productId (e.g., 1 if you have a default product)
UPDATE "Order" SET "productId" = 1 WHERE "productId" IS NULL;

-- Set the column as NOT NULL after updating
ALTER TABLE "Order" ALTER COLUMN "productId" SET NOT NULL;