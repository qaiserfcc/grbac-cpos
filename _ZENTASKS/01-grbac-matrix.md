# 01 - GRBAC Matrix

Status: completed
Assigned: Copilot

Purpose

Define roles, permissions, and resource mapping for CPOS.

Subtasks

- List default roles (admin, manager, cashier, viewer)
- Define permissions per resource (products, sales, inventory, customers)
- Define hierarchy and delegation rules

Acceptance Criteria

- GRBAC matrix saved to `memory-bank/systemPatterns.md` and `01-grbac-matrix.md`

## Default Roles

1. **Super Admin** – Global control over tenancy, security, and configuration. Used by core platform team.
2. **Store Admin** – Regional/store managers responsible for day-to-day configuration, staff onboarding, and escalations.
3. **Store Manager** – Oversees inventory counts, pricing, promotions, and approvals.
4. **Cashier** – Executes POS transactions, returns, and customer lookup according to shift-level permissions.
5. **Analyst / Viewer** – Read-only access to dashboards, inventory levels, and customer insights.

## Permission Catalog

| Resource            | Actions                                   | Permission Codes                                                                                                                    |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Products            | Create, read, update, archive             | `product.create`, `product.read`, `product.update`, `product.archive`                                                               |
| Categories          | CRUD                                      | `category.create`, `category.read`, `category.update`, `category.archive`                                                           |
| Inventory           | Adjust stock, transfer, cycle count       | `inventory.adjust`, `inventory.transfer`, `inventory.count`                                                                         |
| Suppliers           | CRUD, contract upload, compliance checks  | `supplier.create`, `supplier.read`, `supplier.update`, `supplier.archive`, `supplier.contract.upload`, `supplier.compliance.review` |
| Sales & Returns     | Ring sale, issue refund, void transaction | `sale.create`, `sale.refund`, `sale.void`                                                                                           |
| Customers           | Enroll, update profile, GDPR erase        | `customer.create`, `customer.read`, `customer.update`, `customer.erase`                                                             |
| Dashboard / Reports | Read KPIs, export CSV                     | `dashboard.read`, `dashboard.export`                                                                                                |
| Security / RBAC     | Manage users, manage roles, assign roles  | `rbac.manage.users`, `rbac.manage.roles`, `rbac.assign.roles`                                                                       |

## Role to Permission Mapping

| Role             | Granted Permissions                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Super Admin      | All permissions (`*`). Reserved for HQ to configure environments, rotate secrets, and impersonate lower roles for support.                                                           |
| Store Admin      | All resource permissions except platform-level secrets; includes RBAC management within assigned store (users, roles, supplier contracts).                                           |
| Store Manager    | Products (CRUD), Categories (CRUD), Inventory (adjust/transfer/count), Suppliers (read/update/contract upload), Sales (refund/void), Customers (read/update), Dashboard read/export. |
| Cashier          | Products read, Inventory read, Sales create/refund (per shift limit), Customers read + create, Dashboard read (personal KPIs).                                                       |
| Analyst / Viewer | Products read, Inventory read, Sales read (no mutations), Customers read, Dashboard read/export.                                                                                     |

## Hierarchy & Delegation Rules

- Super Admin assigns Store Admins and defines environment-scoped policies. Store Admins cannot elevate themselves to Super Admin.
- Store Admins can create custom roles scoped to their store by selecting subsets of permissions (e.g., "Inventory Specialist" with only `inventory.*`).
- Delegation uses a "cannot grant higher than you have" rule: when assigning a role or custom permission bundle, the delegating user must already possess those permissions.
- Sensitive permissions (`rbac.manage.roles`, `supplier.compliance.review`, `sale.void`) require dual control: Store Admin approval plus automatic audit log with reason code.
- Time-bound roles supported via `validFrom`/`validTo` metadata; background job prunes expired assignments nightly.
- API responses include `effectivePermissions` array, enabling the frontend to gate UI widgets via `HasPermission` component using the same matrix.
