# Catalog CRUD Parity Checklist

This document explains how the Products and Categories dashboards maintain feature-level parity. Use it as a regression guide and as a template for future catalog entities (brands, vendors, bundles, etc.).

## Shared Architecture

- **Frameworks:** Next.js 16 App Router + React 19.
- **State/Data:** SWR for remote fetches with `revalidateOnFocus: false`, fallback datasets from `src/data/fallbacks.ts` to keep UI responsive offline.
- **Forms/Validation:** React Hook Form + Zod schemas (`productSchema`, `categorySchema`) with consistent error surfacing.
- **Permissions:** `HasPermission` gate plus per-action checks (`*.create`, `*.update`, `*.delete`).
- **UI Building Blocks:** `Modal` for create/edit flows, `ConfirmDialog` for destructive actions, Tailwind v4 tokens for styling.
- **Optimistic Strategy:** `mutate` snapshots cached collections, injects optimistic record, and rolls back on failure. Delete flows follow the same pattern.

## Feature Matrix

| Capability     | Products (`src/app/dashboard/products/page.tsx`)                        | Categories (`src/app/dashboard/categories/page.tsx`) |
| -------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| Read gate      | `product.read` HasPermission                                            | `category.read` HasPermission                        |
| Create         | `openCreateModal` preloads defaults, ensures first category is selected | `openCreateModal` resets form, opens modal           |
| Edit           | `openEditModal(product)` populates form                                 | `openEditModal(category)` populates form             |
| Validation     | `productSchema` (name, sku, categoryId, price, stock)                   | `categorySchema` (name, optional description)        |
| Optimism       | Snapshot + optimistic insert/update via SWR mutate                      | Identical snapshot + mutate pattern                  |
| Rollback       | Restores snapshot + surfaces `formError`                                | Restores snapshot + surfaces `formError`             |
| Delete         | `ConfirmDialog` with `requestDelete`, `confirmDelete`                   | Same dialog + `deleteError` feedback                 |
| Empty/fallback | Loading + amber banner messaging if API fails plus fallback seeds       | Same UX copy + fallback seeds                        |

## Manual QA Checklist

1. **Permissions**
   - Toggle each `product.*` or `category.*` scope and confirm buttons disable appropriately.
2. **Create Flow**
   - Open modal, submit valid payload, ensure optimistic row appears before API round-trip, and closes on success.
3. **Validation**
   - Submit invalid payloads (blank name, negative stock) and verify inline errors.
4. **Edit Flow**
   - Launch modal from action menu, ensure fields prefill and Save updates row in place.
5. **Delete Flow**
   - Trigger Delete, confirm dialog text references target, optimistic removal occurs instantly, rollback message shows on forced API failure (e.g., disconnect network).
6. **Fallback Data**
   - Simulate API offline (disable token) and confirm sample dataset renders with amber banner.

## Extending to New Entities

When adding a new catalog surface:

1. Copy the optimistic helper patterns (`snapshotData`, `upsert*`, delete flow) to guarantee consistent UX.
2. Reuse `Modal` + `ConfirmDialog` to avoid fragmenting UX.
3. Update `src/data/fallbacks.ts` with representative seed records.
4. Add schema + tests for new entity validators in `src/lib/validators.ts`.
5. Update this checklist to include the new resource so parity stays transparent.

## Testing Guidance

- Prefer Jest + Testing Library for component-level behaviors (e.g., ensuring modal renders when `isModalOpen` flips). See `npm run test` script in `package.json`.
- For now, linting (`npm run lint`) plus the manual QA checklist above serve as the parity gate.
