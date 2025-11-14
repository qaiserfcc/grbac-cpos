-- Prisma migration generated from provided CPOS schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "username" VARCHAR(100) NOT NULL UNIQUE,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(255),
    "is_enabled" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "roles" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "description" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "permissions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(200) NOT NULL UNIQUE,
    "module" VARCHAR(100),
    "action" VARCHAR(100),
    "description" TEXT
);

CREATE TABLE "role_permissions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "permission_id" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
    UNIQUE("role_id", "permission_id")
);

CREATE TABLE "user_roles" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "assigned_by" UUID REFERENCES "users"("id"),
    "assigned_at" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("user_id", "role_id")
);

CREATE TABLE "dashboard_widgets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "widget_key" VARCHAR(255) NOT NULL UNIQUE,
    "widget_type" VARCHAR(100),
    "data_source" TEXT,
    "default_visible" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "role_widget" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "widget_id" UUID NOT NULL REFERENCES "dashboard_widgets"("id") ON DELETE CASCADE,
    "visible" BOOLEAN DEFAULT TRUE,
    UNIQUE("role_id", "widget_id")
);

CREATE TABLE "sessions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" TEXT NOT NULL,
    "ip_address" VARCHAR(100),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "expires_at" TIMESTAMPTZ
);

CREATE TABLE "categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_by" UUID REFERENCES "users"("id"),
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE "products" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100) UNIQUE,
    "category_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
    "price" NUMERIC(12,2) DEFAULT 0,
    "stock" INT DEFAULT 0,
    "created_by" UUID REFERENCES "users"("id"),
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now()
);
