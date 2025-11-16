CREATE TABLE "suppliers" (
	"id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" VARCHAR(255) NOT NULL,
	"contact_name" VARCHAR(255),
	"contact_email" VARCHAR(255),
	"contact_phone" VARCHAR(50),
	"status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
	"compliance_note" TEXT,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");

CREATE TABLE "customers" (
	"id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	"external_id" VARCHAR(100) UNIQUE,
	"full_name" VARCHAR(255) NOT NULL,
	"email" VARCHAR(255) UNIQUE,
	"phone" VARCHAR(50),
	"loyalty_tier" VARCHAR(100),
	"is_vip" BOOLEAN NOT NULL DEFAULT FALSE,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "customers_email_idx" ON "customers"("email");

ALTER TABLE "products"
	ADD COLUMN "supplier_id" UUID REFERENCES "suppliers"("id") ON DELETE SET NULL;

CREATE TABLE "sales" (
	"id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	"receipt_number" VARCHAR(100) NOT NULL UNIQUE,
	"total" NUMERIC(12,2) NOT NULL DEFAULT 0,
	"tax_total" NUMERIC(12,2) NOT NULL DEFAULT 0,
	"discount_total" NUMERIC(12,2) NOT NULL DEFAULT 0,
	"status" VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
	"payment_method" VARCHAR(50) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
	"created_by" UUID REFERENCES "users"("id"),
	"customer_id" UUID REFERENCES "customers"("id")
);

CREATE INDEX "sales_customer_idx" ON "sales"("customer_id");
CREATE INDEX "sales_created_at_idx" ON "sales"("created_at");

CREATE TABLE "sale_items" (
	"id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	"sale_id" UUID NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
	"product_id" UUID NOT NULL REFERENCES "products"("id"),
	"quantity" INT NOT NULL DEFAULT 1,
	"unit_price" NUMERIC(12,2) NOT NULL,
	"line_total" NUMERIC(12,2) NOT NULL
);

CREATE INDEX "sale_items_sale_idx" ON "sale_items"("sale_id");
CREATE INDEX "sale_items_product_idx" ON "sale_items"("product_id");

CREATE TABLE "inventory" (
	"id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	"product_id" UUID NOT NULL UNIQUE REFERENCES "products"("id") ON DELETE CASCADE,
	"supplier_id" UUID REFERENCES "suppliers"("id") ON DELETE SET NULL,
	"quantity_on_hand" INT NOT NULL DEFAULT 0,
	"reorder_point" INT NOT NULL DEFAULT 0,
	"safety_stock" INT NOT NULL DEFAULT 0,
	"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "inventory_adjustments" (
	"id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	"inventory_id" UUID NOT NULL REFERENCES "inventory"("id") ON DELETE CASCADE,
	"delta" INT NOT NULL,
	"reason" TEXT,
	"reference" VARCHAR(255),
	"created_by" UUID REFERENCES "users"("id"),
	"created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "inventory_adjustments_inventory_idx" ON "inventory_adjustments"("inventory_id");
