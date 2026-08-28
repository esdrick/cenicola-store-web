-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'inventario', 'embalador', 'vendedora_online', 'vendedora_tienda');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('entrada', 'salida_venta', 'ajuste', 'devolucion');

-- CreateEnum
CREATE TYPE "MovementChannel" AS ENUM ('online', 'tienda', 'total');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('online', 'tienda');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pendiente_pago', 'pago_parcial', 'pago_verificado', 'en_embalaje', 'listo_para_retiro', 'enviada', 'completada', 'cancelada');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('efectivo_bs', 'efectivo_usd', 'transferencia', 'zelle', 'pago_movil', 'usdt');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pendiente', 'verificado', 'rechazado');

-- CreateEnum
CREATE TYPE "ReceivableStatus" AS ENUM ('pendiente', 'cobrado_parcial', 'cobrado', 'vencido');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('active', 'converting');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('V', 'P', 'J', 'E');

-- CreateEnum
CREATE TYPE "PricingMethod" AS ENUM ('bcv', 'divisas');

-- CreateEnum
CREATE TYPE "TipoCierre" AS ENUM ('diario', 'semanal', 'quincenal', 'mensual', 'personalizado');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "photos" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "quick_sale" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "stock_total" INTEGER NOT NULL DEFAULT 0,
    "stock_online" INTEGER NOT NULL DEFAULT 0,
    "stock_store" INTEGER NOT NULL DEFAULT 0,
    "price_bcv" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "price_divisas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "price_bundle_bcv" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "price_bundle_divisas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "price_mayor_bcv" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "price_mayor_divisas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "channel" "MovementChannel" NOT NULL,
    "qty_before" INTEGER NOT NULL,
    "qty_change" INTEGER NOT NULL,
    "qty_after" INTEGER NOT NULL,
    "reason" TEXT,
    "order_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "doc_type" "DocumentType" NOT NULL,
    "doc_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_code" TEXT,
    "verification_expiry" TIMESTAMP(3),
    "reset_token" TEXT,
    "reset_token_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "channel" "OrderChannel" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pendiente_pago',
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_lastname" TEXT NOT NULL,
    "customer_id_doc" TEXT NOT NULL,
    "address" TEXT,
    "shipping_company" TEXT,
    "total_usd" DECIMAL(10,2) NOT NULL,
    "pricing_method" "PricingMethod",
    "total_bcv_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_divisas_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "exchange_rate_id" TEXT,
    "is_partial_agreed" BOOLEAN NOT NULL DEFAULT false,
    "partial_agreed_by" TEXT,
    "notes" TEXT,
    "pago_verificado_at" TIMESTAMP(3),
    "incluido_en_cierre_id" TEXT,
    "incluido_en_nomina_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_usd" DECIMAL(10,2) NOT NULL,
    "subtotal_usd" DECIMAL(10,2) NOT NULL,
    "quantity_bcv" INTEGER NOT NULL DEFAULT 0,
    "quantity_divisas" INTEGER NOT NULL DEFAULT 0,
    "subtotal_bcv_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal_divisas_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "variant_snapshot" JSONB NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "amount_usd" DECIMAL(10,2) NOT NULL,
    "amount_ves" DECIMAL(14,2),
    "exchange_rate_id" TEXT,
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "payment_date" DATE NOT NULL,
    "payment_time" TEXT,
    "reference" TEXT NOT NULL,
    "reference_hash" TEXT,
    "payment_photo" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pendiente',
    "rejection_reason" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_shipments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "packed_by" TEXT NOT NULL,
    "packed_at" TIMESTAMP(3) NOT NULL,
    "shipped_at" TIMESTAMP(3),
    "tracking_number" TEXT,
    "photo_package" TEXT NOT NULL,
    "photo_receipt" TEXT,
    "photo_guide" TEXT,
    "notes" TEXT,
    "edited_at" TIMESTAMP(3),
    "edited_by" TEXT,

    CONSTRAINT "order_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "rate_date" DATE NOT NULL,
    "usd_to_ves" DECIMAL(14,4) NOT NULL,
    "eur_to_ves" DECIMAL(14,4),
    "paralelo_to_ves" DECIMAL(14,4),
    "btc_usd" DECIMAL(14,2),
    "source" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount_usd" DECIMAL(10,2) NOT NULL,
    "amount_ves" DECIMAL(14,2),
    "exchange_rate_id" TEXT,
    "expense_date" DATE NOT NULL,
    "receipt_photo" TEXT,
    "notas" TEXT,
    "payroll_record_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "debtor_name" TEXT NOT NULL,
    "amount_usd" DECIMAL(10,2) NOT NULL,
    "amount_paid_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "due_date" DATE NOT NULL,
    "status" "ReceivableStatus" NOT NULL DEFAULT 'pendiente',
    "order_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "base_salary_usd" DECIMAL(10,2) NOT NULL,
    "commission_usd" DECIMAL(10,2) NOT NULL,
    "bonuses_usd" DECIMAL(10,2) NOT NULL,
    "deductions_usd" DECIMAL(10,2) NOT NULL,
    "total_usd" DECIMAL(10,2) NOT NULL,
    "exchange_rate_id" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3),
    "sales_summary" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "data_before" JSONB,
    "data_after" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodo_tipo" TEXT NOT NULL DEFAULT 'mes',
    "periodo_inicio" DATE NOT NULL,
    "periodo_fin" DATE NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "total_ventas" DECIMAL(10,2) NOT NULL,
    "comision" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_payable" (
    "id" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "paid_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "channel" "OrderChannel" NOT NULL,
    "pricing_method" "PricingMethod" NOT NULL DEFAULT 'bcv',
    "note" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_usd" DECIMAL(10,2) NOT NULL,
    "quantity_bcv" INTEGER NOT NULL DEFAULT 0,
    "quantity_divisas" INTEGER NOT NULL DEFAULT 0,
    "subtotal_bcv_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal_divisas_usd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierres_tienda" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCierre" NOT NULL,
    "canal" "OrderChannel" NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "generado_por_id" TEXT NOT NULL,
    "total_piezas" INTEGER NOT NULL,
    "resumen_totales" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cierres_tienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierre_tienda_detalles" (
    "id" TEXT NOT NULL,
    "cierre_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "numero_orden" TEXT NOT NULL,
    "cliente_nombre" TEXT NOT NULL,
    "fecha_confirmacion" TIMESTAMP(3) NOT NULL,
    "cantidad_piezas" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "moneda" TEXT NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "referencia_pago" TEXT NOT NULL,

    CONSTRAINT "cierre_tienda_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierres_sistema" (
    "id" TEXT NOT NULL,
    "fecha_corte" TIMESTAMP(3) NOT NULL,
    "confirmado_por_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cierres_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "products_color_idx" ON "products"("color");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_doc_type_doc_number_idx" ON "customers"("doc_type", "doc_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "order_payments_reference_hash_idx" ON "order_payments"("reference_hash");

-- CreateIndex
CREATE UNIQUE INDEX "order_shipments_order_id_key" ON "order_shipments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_rate_date_key" ON "exchange_rates"("rate_date");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_records_userId_periodo_inicio_periodo_fin_key" ON "payroll_records"("userId", "periodo_inicio", "periodo_fin");

-- CreateIndex
CREATE INDEX "cierres_tienda_fecha_inicio_fecha_fin_idx" ON "cierres_tienda"("fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "cierres_tienda_canal_idx" ON "cierres_tienda"("canal");

-- CreateIndex
CREATE INDEX "cierre_tienda_detalles_cierre_id_idx" ON "cierre_tienda_detalles"("cierre_id");

-- CreateIndex
CREATE INDEX "cierres_sistema_created_at_idx" ON "cierres_sistema"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_partial_agreed_by_fkey" FOREIGN KEY ("partial_agreed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "exchange_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_incluido_en_cierre_id_fkey" FOREIGN KEY ("incluido_en_cierre_id") REFERENCES "cierres_tienda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_incluido_en_nomina_id_fkey" FOREIGN KEY ("incluido_en_nomina_id") REFERENCES "payroll_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "exchange_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_packed_by_fkey" FOREIGN KEY ("packed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "exchange_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payroll_record_id_fkey" FOREIGN KEY ("payroll_record_id") REFERENCES "payroll_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "exchange_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_tienda" ADD CONSTRAINT "cierres_tienda_generado_por_id_fkey" FOREIGN KEY ("generado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierre_tienda_detalles" ADD CONSTRAINT "cierre_tienda_detalles_cierre_id_fkey" FOREIGN KEY ("cierre_id") REFERENCES "cierres_tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cierres_sistema" ADD CONSTRAINT "cierres_sistema_confirmado_por_id_fkey" FOREIGN KEY ("confirmado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

