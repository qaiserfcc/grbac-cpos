# 01 - Prisma Schema Draft

Status: completed
Assigned: Copilot

Purpose

Draft the `prisma/schema.prisma` models for the CPOS domain.

Subtasks

- Model User, Product, Sale, SaleItem, Customer, Inventory, Supplier
- Add indexes and constraints
- Generate initial migration

Acceptance Criteria

- `prisma/schema.prisma` draft present
- Migration file created

Deliverables:

- `backend/prisma/schema.prisma` updated with Customer, Supplier, Sale, SaleItem, Inventory, InventoryAdjustment models + relations.
- `backend/prisma/migrations/202511160001_domain_entities/migration.sql` captures ALTER/CREATE statements.
