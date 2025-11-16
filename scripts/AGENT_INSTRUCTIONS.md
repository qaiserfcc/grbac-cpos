# CPOS Granular RBAC Project — Build Instructions for Copilot Agents

## 1. Objective

Build a production-ready, full-stack project named **`cpos`** that showcases granular role-based access control (RBAC). Deliver an Express/Node.js backend, PostgreSQL database (Dockerized), and Next.js frontend with robust JWT authentication, role/permission enforcement, and role-driven dashboard widgets.

## 2. Technology & Tooling Requirements

- **Backend:** Node.js 18+, Express, TypeScript optional but encouraged.
- **Auth:** JSON Web Tokens (short-lived access + refresh), `bcrypt` for password hashing, `jsonwebtoken` for tokens.
- **Database:** PostgreSQL 14+. Provide Docker image via `docker-compose.yml`.
- **ORM / Query Layer:** Choose **Prisma** (preferred), Sequelize, or Knex. Prisma recommended for schema portability.
- **Frontend:** Next.js 13+ (App Router preferred; Pages Router acceptable). Use React Server Components where practical.
- **Testing:** Jest + Supertest (backend), Playwright or React Testing Library (frontend) for at least smoke tests.
- **Linting/Formatting:** ESLint + Prettier across repo; shareable config at repo root.

## 3. High-Level Deliverables

1. **Backend service** with modular folders (`config`, `models`, `controllers`, `routes`, `middleware`, `utils`).
2. **Database migrations + seed scripts** reproducing the supplied `cpos_rbac_schema.sql` entities and sample data (roles, permissions, widgets, demo Super Admin user with hashed password).
3. **Frontend app** covering auth flow, protected dashboard, and CRUD screens for products & categories with role-aware widgets.
4. **Comprehensive documentation** (`README.md`) covering setup, env vars, migrations, seeding, and run instructions.
5. **Dev tooling**: Docker Compose orchestrating Postgres + backend + frontend; `.env.example` files for backend and frontend.

## 4. Repository & Folder Structure

```
cpos/
├── backend/
│   ├── src/
│   │   ├── config/          # env, db, jwt config
│   │   ├── models/          # ORM models / schema definitions
│   │   ├── controllers/     # business logic per domain
│   │   ├── routes/          # Express routers
│   │   ├── middleware/      # auth, role, permission guards
│   │   └── utils/           # helpers (e.g., token service)
│   ├── prisma/ or migrations/ (if using Prisma/Knex)
│   ├── tests/
│   ├── package.json
│   └── server.ts or server.js
│
├── frontend/
│   ├── app/ (or pages/)
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── styles/
│   ├── tests/
│   └── package.json
│
├── docker-compose.yml
├── README.md
└── .github/workflows/ci.yml (basic CI running lint/test)
```

## 5. Database & Migrations

- Base schema must match the provided SQL dump exactly (tables: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `dashboard_widgets`, `role_widget`, `sessions`, `categories`, `products`).
- Ensure UUID primary keys leveraging `uuid-ossp` extension or Prisma's `uuid()`.
- Include migration/seed scripts that:
  - Insert the sample roles (`Super Admin`, `Product Admin`, `Category Admin`).
  - Insert the listed permissions and dashboard widgets.
  - Create a demo Super Admin user with email `admin@cpos.local` and password `Passw0rd!` (hashed via bcrypt, cost ≥10).
  - Map default permissions and widgets to the roles mirroring the SQL dump intent (e.g., Super Admin gets all permissions; Product Admin gets product permissions + product widgets).
- Provide npm scripts: `npm run db:migrate`, `npm run db:seed`, `npm run db:reset` (migrate + seed).

## 6. Backend Requirements

### 6.1 Configuration

- Load env via `dotenv` (`.env` and `.env.example`). Required vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `PORT` (default 4000).
- Central DB client (Prisma/Knex/Sequelize) exported from `src/config/database.ts`.

### 6.2 Authentication & Sessions

- Endpoints under `/api/auth`:
  - `POST /login`: accepts username/email + password; returns access & refresh tokens plus user profile & roles.
  - `POST /register`: Super Admin only; creates new user, assigns roles; enforces strong password validation.
  - `POST /refresh`: accepts refresh token, validates session in `sessions` table, rotates tokens.
  - `POST /logout`: invalidates refresh token/session entry.
- Store refresh tokens (hashed) in `sessions` with expiry; remove on logout or TTL expiry job.

### 6.3 Middleware Contracts

- `verifyToken`: extracts JWT from `Authorization: Bearer`, verifies, attaches `req.user` with `id`, `roles`, `permissions`.
- `checkRole(roles: string[])`: ensures user has at least one role; respond 403 otherwise.
- `checkPermission(permissionName: string)`: ensures permission present in `req.user.permissions` computed from DB lookup.
- Provide shared error handler returning JSON problem responses.

### 6.4 RBAC & Domain APIs

Use Express routers versioned under `/api`:

- `/api/rbac/roles`: CRUD roles.
- `/api/rbac/permissions`: list & manage permissions (CRUD for Super Admin, read-only for others with privilege).
- `/api/rbac/user-roles`: assign/remove roles per user.
- `/api/products`: CRUD with permission gates (`product.create/read/update/delete`).
- `/api/categories`: CRUD with matching category permissions.
- `/api/dashboard/widgets`: returns widgets visible to current user based on `role_widget` mapping + `default_visible`.
- Controllers must log audit events (at least console) for RBAC mutations.
- Provide request validation via `zod` or `joi` (preferred `zod`).

### 6.5 Testing & Quality Gates

- Jest + Supertest covering at minimum: auth login, role-guarded route, product CRUD happy path.
- ESLint/Prettier configs shared at repo root; backend `package.json` scripts: `lint`, `test`, `dev` (nodemon), `build` (tsc if TS).

## 7. Frontend Requirements

### 7.1 Pages & Routing

- Authentication pages: `/login`, `/register` (optional self-service), handling token storage (secure cookies or memory + httpOnly refresh via API route).
- Protected dashboard `/dashboard` (App Router layout) fetching allowed widgets from backend.
- Management sections:
  - `/dashboard/products` (list, create, edit, delete) with permission checks.
  - `/dashboard/categories` similar to products.
  - `/dashboard/rbac` (role & user-role admin) visible only to Super Admin.
- Implement route guards (Next middleware or client redirect) that check session; fallback to login.

### 7.2 UI & State

- Component library: Tailwind CSS or Chakra UI (choose one; Tailwind preferred). Provide consistent theming.
- Global auth context (React Context + hook) storing user info, roles, permissions.
- Data fetching via `fetch` wrappers stored in `frontend/lib/api.ts` with typed responses.
- Role-aware components: `HasPermission` and `HasRole` wrappers controlling visibility of widgets/sections.
- Dashboard widgets should request `/api/dashboard/widgets`; render cards based on `widget_type`. Provide sample widgets (chart placeholder, table, KPI cards).

### 7.3 Testing & Linting

- Add minimal Jest/RTL or Playwright tests verifying widget visibility by role.
- `package.json` scripts: `dev`, `build`, `start`, `lint`, `test`.

## 8. API Contract Summary

Document endpoint specs in `README.md` or dedicated `docs/api.md`, including request/response payloads for:

- Auth (`/api/auth/login|register|refresh|logout`).
- RBAC (`/api/rbac/roles`, `/api/rbac/permissions`, `/api/rbac/user-roles`).
- Products & Categories CRUD.
- Dashboard widgets.
  Include HTTP status codes, sample payloads, and required permissions per route.

## 9. Access Model & Widgets

- **Roles:** `Super Admin`, `Product Admin`, `Category Admin`.
- Map permissions per provided list (e.g., `product.create`, `category.read`, `rbac.manage.roles`, `dashboard.view.products`, etc.).
- Widget visibility stored in `role_widget`; backend query joins user roles to widgets and returns unique set.
- Ensure no role hierarchy assumption—permissions strictly derived from mappings.

## 10. Docker & Dev Experience

- `docker-compose.yml` should spin up `postgres`, `backend`, `frontend`. Backend waits for DB healthy before migration.
- Provide `Makefile` shortcut commands (optional) for `make up`, `make down`, `make logs`.
- Include VS Code devcontainer (optional) for consistent environment.

## 11. Documentation & DX

- Root `README.md` must include:
  - Project overview.
  - Prerequisites.
  - Setup steps (env creation, install, migrate, seed, run dev/prod builds).
  - Testing instructions.
  - API reference pointer.
- Provide `.env.example` for backend/frontend capturing required env vars.
- Add CONTRIBUTING.md summarizing branching strategy and coding standards if time allows.

## 12. Acceptance Criteria Checklist

- [ ] `docker-compose up` launches DB, backend, frontend; migrations & seeds run automatically or via documented command.
- [ ] Login with seeded Super Admin succeeds; dashboard shows all widgets.
- [ ] Product Admin demo user restricted to product endpoints and widgets.
- [ ] Middleware correctly blocks unauthorized access (unit + integration tests).
- [ ] Frontend conditionally renders UI blocks via `HasPermission`/`HasRole` wrappers.
- [ ] CI workflow runs lint + tests for both backend and frontend on pull requests.

## 13. Nice-to-Haves (Optional)

- Activity audit log endpoint (append-only) showing RBAC changes.
- WebSocket or SSE channel pushing widget updates.
- Theming switch and responsive design tuned for tablets.
- Storybook for shared UI components.

---

Use these instructions as the single source of truth when scaffolding or extending the CPOS project. Prioritize security (hashed secrets, HTTPS-ready configuration), clean architecture, and thorough documentation.
