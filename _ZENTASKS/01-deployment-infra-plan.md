# 01 - Deployment & Infra Plan

Status: completed
Assigned: Copilot

Purpose

Define deployment targets, environment architecture, and secrets management.

Subtasks

- Choose hosts (Vercel, Neon, S3)
- Define env var plan and secret storage
- Document migration & seed automation

Acceptance Criteria

- Deployment plan documented in `01-deployment-infra-plan.md`

## Deployment Targets & Topology

- **Frontend**: Deploy Next.js app to Vercel (Production / Preview branches). Preview builds trigger on PRs targeting `develop`; production deploys are promoted from `main`.
- **Backend API**: Containerized Express app runs on Azure Container Apps (ACA) with autoscale rules (CPU > 70% or RPS > 200 => +1 replica up to 5). Alternative: AKS cluster using the same container image.
- **Database**: Neon PostgreSQL (Production, Staging, Dev). Each environment has isolated branch + connection string; use connection pooling (PgBouncer) via Neon proxy.
- **Object Storage / CDN**: Receipts, reports, and exports stored in Azure Blob Storage (Hot tier) with CDN endpoint (Azure Front Door) for global cache. Static assets from frontend served directly by Vercel’s CDN.
- **Async/Eventing**: Azure Service Bus namespace per environment for background jobs, notifications, and integrations.

## Environments

| Env       | Branch           | Purpose                                              | Infra Notes                                                                                                     |
| --------- | ---------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `dev`     | Feature branches | Rapid iteration; seeded data auto-refreshed nightly. | ACA Dev environment (1 replica), Neon dev DB branch, Service Bus `dev` namespace.                               |
| `staging` | `develop`        | Pre-prod validation, performance, UAT.               | ACA staging environment (min 2 replicas), Neon staging branch, full CI smoke tests.                             |
| `prod`    | `main`           | Customer-facing workloads.                           | ACA prod environment (min 3 replicas, autoscale up to 8), Neon prod branch w/ PITR, Service Bus prod namespace. |

## Environment Variables & Secrets

| Variable                          | Description                           | Scope           | Storage                                                                            |
| --------------------------------- | ------------------------------------- | --------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Prisma connection string per env      | Backend         | Stored in Azure Key Vault; injected into ACA + GitHub secrets (for CI migrations). |
| `NEON_DATABASE_URL`               | Read replica connection for reporting | Backend         | Key Vault + GitHub.                                                                |
| `JWT_SECRET`                      | HMAC secret for tokens                | Backend         | Key Vault (rotated quarterly).                                                     |
| `REFRESH_TOKEN_SECRET`            | Separate secret for refresh tokens    | Backend         | Key Vault.                                                                         |
| `VERCEL_TOKEN`                    | Deploy hook token                     | CI only         | GitHub secret `VERCEL_TOKEN`.                                                      |
| `NEXT_PUBLIC_API_BASE_URL`        | API base for frontend                 | Frontend        | Vercel env vars (dev/staging/prod).                                                |
| `SERVICE_BUS_CONNECTION`          | Azure Service Bus connection          | Backend workers | Key Vault + GitHub.                                                                |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob storage credentials              | Backend         | Key Vault + GitHub.                                                                |

- Secrets managed centrally via Key Vault; GitHub Actions receives short-lived secrets using OpenID Connect (federated credentials). Vercel environment variables synced via `vercel env pull` from Key Vault-exported JSON.

## CI/CD Flow

1. **Lint/Test gates**: GitHub Actions `ci.yml` runs lint, tests, format check on push/PR.

1. **Backend Deploy**: On `develop` or `main`, build Docker image, push to Azure Container Registry, run `npm run db:migrate` against the target Neon branch inside the workflow, then deploy to ACA using `az containerapp up --revision-suffix $GIT_SHA` with blue/green traffic shifting.

1. **Frontend Deploy**: GitHub Action triggers Vercel deploy via deploy hook, providing the environment alias (`develop` → staging, `main` → production).

## Migrations & Seeds Automation

- Prisma migrations stored in repo. Workflows run:

  ```bash
  npm install
  npm run db:generate -w backend
  npm run db:migrate -w backend
  npm run db:seed -w backend
  ```

- For dev/staging, seeds run on every deploy to keep fixture data fresh (idempotent seed script). Production seed only runs manually via `ts-node prisma/seed.ts --env=prod` after approvals.
- Scheduled GitHub Action (weekly) executes `db:reset` on dev environment to ensure consistent baseline.

## Monitoring & DR

- Azure Monitor collects logs/metrics; alerts wired to PagerDuty.
- Nightly Neon backups with PITR (7-day window for staging, 30-day for prod). Blob storage snapshots replicated to paired region.
- Infra-as-code tracked via Bicep (ACA, Service Bus, Storage); future Terraform migration noted.
