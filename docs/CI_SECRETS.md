# GitHub Actions Secrets

The CI workflow requires the following secrets to run deployment or environment-specific steps:

| Secret                                | Purpose                                                       |
| ------------------------------------- | ------------------------------------------------------------- |
| `VERCEL_TOKEN`                        | Used to trigger Vercel deployments or access Vercel APIs.     |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Identify the Vercel project when promoting builds.            |
| `NEON_DATABASE_URL`                   | Connection string for running Prisma migrations against Neon. |
| `JWT_SECRET`                          | Shared secret for backend tests that require JWT signing.     |

Add these secrets under **Settings → Secrets and variables → Actions** in GitHub before enabling deployment steps.
