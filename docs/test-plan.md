# CPOS Test Plan

> Last updated: 2025-11-16

## 1. Test Pyramid Overview

| Layer             | Tooling                                                            | Scope                                                               | Cadence                                        |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------- |
| Unit              | Jest + ts-jest (backend), Jest + @testing-library/react (frontend) | Pure functions, services, hooks, validators                         | Run on every commit (CI + pre-push optional).  |
| Integration / API | Jest + Supertest                                                   | HTTP contracts (auth, RBAC, products, sales) against Prisma test DB | Run per commit + nightly scheduled job.        |
| End-to-End        | Playwright (Chromium, WebKit, Firefox)                             | Critical user journeys across RBAC roles                            | Run on PRs to `develop` and nightly on `main`. |
| Non-functional    | k6 / Lighthouse (future)                                           | Performance budget, accessibility, bundle analysis                  | Weekly pipeline + pre-release.                 |

## 2. Critical End-to-End Flows (Playwright)

1. **Auth & RBAC**
   - Login as Store Admin, verify dashboard widgets gated by permissions.
   - Attempt cashier login with missing permission → expect blocked navigation.
2. **Product Catalog Management**
   - Create category + product, verify optimistic UI, edit, archive.
   - Permission boundary: viewer cannot see "New product" button.
3. **Sales & Returns**
   - Cashier rings sale with multiple items, generates receipt number.
   - Manager issues refund, audit log entry asserted.
4. **Inventory & Supplier Coordination**
   - Manager creates supplier, links to product, performs stock adjustment, ensures dashboard updates.
5. **Customer Lifecycle**
   - Capture new customer, edit profile, submit GDPR erase request.
6. **Reporting Dashboards**
   - Analyst role exports KPI CSV, ensures rate limit/responses succeed.

## 3. Jest / Unit Testing Strategy

- **Coverage thresholds** (configured in `package.json` / jest config):
  - Statements 85%
  - Branches 80%
  - Functions 85%
  - Lines 85%
- Critical targets:
  - Backend services (`services/*.ts`) including RBAC, auth, inventory adjustments.
  - Controllers ensure happy-path + error-handling.
  - Frontend hooks (`useAuth`, SWR fetchers) and validators (Zod schemas).
- Snapshot tests avoided in favor of explicit assertions.

## 4. Integration Testing

- Uses Supertest with an isolated Prisma database schema (`DATABASE_URL=postgres://.../cpos_test`).
- **Lifecycle per test file:**

  ```ts
  beforeAll(async () => {
    await prisma.$executeRaw`TRUNCATE ... CASCADE`;
    await seedTestData();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
  ```

- Seeds reuse `prisma/seed.ts` with a `TEST` flag to load lightweight fixtures.
- GitHub Actions spins up a Neon branching database per workflow using `NEON_TEST_DATABASE_URL`.

## 5. Test Data & DB Strategy

- **Local**: `.env.test` contains Neon dev branch connection; `npm run test:api` automatically pushes migrations and seeds before suite.
- **CI**: Workflow job creates ephemeral Neon branch using CLI, sets `DATABASE_URL`, runs migrations + seeds, drops branch after tests.
- **Playwright**: Uses API helpers to create fixtures via backend endpoints instead of direct DB access; ensures compatibility with production auth.

## 6. Reporting & Observability

- Playwright HTML report stored under `frontend/playwright-report/` and uploaded as workflow artifact.
- Jest + Supertest coverage generated to `coverage/` directories and uploaded.
- Failures auto-create GitHub issue via workflow with logs + video attachments.

## 7. Ownership & SLAs

- QA Engineer owns E2E suite hygiene; Backend Lead approves changes to test data seeding.
- Test failures on `main` must be triaged within 30 minutes; flaky tests tracked in `docs/test-plan.md#flaky-tests` (section TBD).

## 8. Next Steps

- Add k6 smoke script for sales API (goal: <300ms p95).
- Wire accessibility checks (axe-core) into Playwright.
- Expand contract tests once OpenAPI is finalized.
