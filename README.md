# CPOS Monorepo

Cloud POS (CPOS) is a GRBAC-enabled point of sale platform composed of a backend API (`cpos-api`) and a frontend web application (`cpos-web`). This repository also contains planning artifacts (`_ZENTASKS`), architectural memory (`memory-bank`), and shared scripts.

## Repository Structure

- `backend/` – Express + Prisma API (cpos-api)
- `frontend/` – Next.js web app (cpos-web)
- `_ZENTASKS/` – Task breakdown files for AI agents
- `memory-bank/` – Project context, decisions, and progress
- `scripts/` – Automation scripts (e.g., OpenAPI generation)
- `.github/` – Copilot instructions, workflows, and templates

## Branch Strategy

| Branch      | Purpose                                        |
| ----------- | ---------------------------------------------- |
| `main`      | Production-ready code, mirrored to deployments |
| `develop`   | Integrated work ready for QA/staging           |
| `feature/*` | Short-lived branches per task or feature       |

Workflow:

1. Branch from `develop` using `feature/<task-name>`.
2. Open PR into `develop` with passing checks.
3. After approval, merge into `develop`; release PRs go from `develop` to `main`.

## Contribution Checklist

1. Run lint + tests locally for touched packages.
2. Update docs/task files if behavior changes.
3. Ensure PR template checklist is complete.

## Getting Started

```bash
# Install dependencies for root tooling (if any)
npm install

# See backend/README.md and frontend/README.md for service-specific steps.
```

---

Maintainers: @qaiserfcc
