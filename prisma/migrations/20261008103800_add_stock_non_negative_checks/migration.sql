-- 1. Normalizar valores que pudieran haber quedado negativos previamente
UPDATE "product_variants" SET "stock_online" = 0 WHERE "stock_online" < 0;
UPDATE "product_variants" SET "stock_store" = 0 WHERE "stock_store" < 0;
UPDATE "product_variants" SET "stock_total" = 0 WHERE "stock_total" < 0;

-- 2. Agregar restricciones CHECK para blindar el inventario contra stock negativo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_stock_online_non_negative'
    ) THEN
        ALTER TABLE "product_variants" 
        ADD CONSTRAINT "chk_stock_online_non_negative" CHECK ("stock_online" >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_stock_store_non_negative'
    ) THEN
        ALTER TABLE "product_variants" 
        ADD CONSTRAINT "chk_stock_store_non_negative" CHECK ("stock_store" >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_stock_total_non_negative'
    ) THEN
        ALTER TABLE "product_variants" 
        ADD CONSTRAINT "chk_stock_total_non_negative" CHECK ("stock_total" >= 0);
    END IF;
END $$;
