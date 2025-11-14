# GRBAC CPOS Frontend

RBAC-aware merchant console built on Next.js 16 App Router with React 19, SWR, Tailwind v4, and React Hook Form + Zod for type-safe CRUD flows.

## Feature Snapshot

- Authenticated dashboard with HasPermission guards per domain object.
- Products and Categories screens share the same modal + confirmation patterns, optimistic SWR mutations, and API-backed CRUD flows with fallback data.
- Reusable UI primitives (`Modal`, `ConfirmDialog`) and validator schemas ensure consistent UX.
- Detailed parity checklist for catalog entities lives in [`docs/crud-parity.md`](./docs/crud-parity.md).

## Local Development

```bash
npm install
npm run dev
```

- App boots on [http://localhost:3000](http://localhost:3000).
- Environment variables for API base URLs/tokens live in `.env.local` (see `next.config.ts` for usage).

## Quality Gates

| Command        | Purpose                      |
| -------------- | ---------------------------- |
| `npm run lint` | ESLint (Next config)         |
| `npm run test` | Jest DOM/unit tests (JS DOM) |
| `npm run build`| Type-safe Next.js build      |

Run lint + tests before submitting changes; optimistic mutation flows rely on inferred types, so type errors can hide runtime regressions.

## Dashboard CRUD Parity

Both `Products` and `Categories` implement the exact same contract for create/edit/delete, form validation, modal UX, permissions, fallback data, and SWR mutation strategy. Use the checklist in [`docs/crud-parity.md`](./docs/crud-parity.md) when adding a new catalog surface (e.g., brands) to ensure the same guarantees.

## Deployment

The app deploys via standard Next.js workflows (Vercel, Docker, custom CI). Ensure environment secrets include:

- `API_BASE_URL`
- `NEXT_PUBLIC_AUTH_DOMAIN`
- `NEXT_PUBLIC_AUTH_CLIENT_ID`

See infra repo notes for provisioning RBAC scopes and CDN/cache config.
