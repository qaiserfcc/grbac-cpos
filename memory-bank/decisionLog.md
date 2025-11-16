# Decision Log

| Date       | Decision                                      | Rationale                                                                                               |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 2025-10-01 | Adopt Next.js 16 for frontend                 | Provides modern React features, SSR, and excellent developer experience for building scalable web apps. |
| 2025-10-05 | Use Express.js with TypeScript for backend    | Lightweight, flexible, and strongly typed for API development and maintenance.                          |
| 2025-10-10 | Integrate Prisma ORM with PostgreSQL          | Type-safe database access, automatic migrations, and schema management to reduce errors.                |
| 2025-10-15 | Implement JWT-based authentication            | Secure, stateless authentication suitable for REST APIs and scalable deployments.                       |
| 2025-10-20 | Add custom RBAC middleware                    | Granular permission control essential for multi-user POS systems in business environments.              |
| 2025-10-25 | Choose SWR for data fetching                  | Handles caching, revalidation, and optimistic updates efficiently in React apps.                        |
| 2025-11-01 | Use Playwright for E2E testing                | Cross-browser support and robust API for testing complex user flows in the POS interface.               |
| 2025-11-10 | Disable mobile Playwright tests               | Focus on desktop stability; mobile tests can be re-enabled when specifically requested.                 |
| 2025-11-15 | Fix integration tests with deterministic data | Ensures reliable CI/CD by creating fresh test data per test and using proper waits/assertions.          |
