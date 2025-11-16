# CPOS Architecture & Non-Functional Requirements

## 1. System Overview

CPOS (Cloud Point of Sale) is a multi-tenant, cloud-native platform that manages RBAC-governed access to retail operations (sales, inventory, suppliers, reporting, and customer engagement). The solution is designed for modular growth: the web frontend orchestrates user interactions, a TypeScript/Express backend enforces business logic and RBAC, Prisma manages persistence in PostgreSQL, and asynchronous events keep external integrations in sync.

Key principles:

- **Granular RBAC everywhere** – permissions are resolved on every request and propagated to UI components.
- **API-first contracts** – REST endpoints (OpenAPI-described) back all user flows and integrations.
- **Operational transparency** – metrics, logs, and structured audits are emitted per request for SIEM ingestion.
- **Cloud portability** – container-friendly services that can be deployed to any managed Kubernetes or serverless environment.

## 2. Logical Architecture

```mermaid
flowchart LR
    subgraph Client
        Browser[Web Browsers]
    end

    subgraph Frontend
        NextJS[Next.js App Router
        (SSR/ISR)]
        AuthCtx[Auth & RBAC Context]
    end

    subgraph Backend
        APIGW[Express API Gateway]
        AuthSvc[Auth & RBAC Service]
        InvSvc[Inventory & Catalogue]
        SalesSvc[Sales & Returns]
        CustSvc[Customer/CRM]
        DashboardSvc[Analytics API]
    end

    subgraph Data Plane
        Postgres[(PostgreSQL / Neon)]
        Redis[(Optional Redis Cache)]
        ObjectStore[(Blob Storage for reports/receipts)]
    end

    subgraph Async & Integrations
        EventBus[(Event Bus / Queue)]
        Payments[(Payment Gateway APIs)]
        Analytics[(BI / Data Warehouse)]
    end

    Browser -->|HTTPS| NextJS
    NextJS -->|JWT + REST| APIGW
    APIGW --> AuthSvc
    APIGW --> InvSvc
    APIGW --> SalesSvc
    APIGW --> CustSvc
    APIGW --> DashboardSvc
    AuthSvc --> Postgres
    InvSvc --> Postgres
    SalesSvc --> Postgres
    CustSvc --> Postgres
    DashboardSvc --> Postgres
    APIGW <-->|Cache| Redis
    SalesSvc --> EventBus
    InvSvc --> EventBus
    EventBus --> Payments
    EventBus --> Analytics
    DashboardSvc --> ObjectStore
```

### Component Responsibilities

| Layer                 | Responsibilities                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frontend (Next.js)    | Auth/session handling, RBAC-aware navigation, optimistic UI, SWR data fetching, WebSocket/event-stream clients.                                                                                                    |
| API Gateway (Express) | Central routing, authentication/authorization middleware, rate limiting, request tracing.                                                                                                                          |
| Domain Services       | Auth/RBAC (token issuance, policy enforcement, audit); Inventory (products, categories, stock); Sales & Returns (transactions, receipts); Customers (profiles, loyalty); Dashboard (aggregations, reporting APIs). |
| Data Plane            | PostgreSQL via Prisma (OLTP), Redis for session/cache (future), object storage for exports, encrypted secrets in key vault.                                                                                        |
| Async Integrations    | Event bus for decoupled processing (webhooks, notifications), adapters for payment gateways, analytics loaders.                                                                                                    |

### Deployment Topology

- **Containers**: Backend services packaged as containers, deployed to managed Kubernetes (AKS/EKS/GKE) or container apps. Horizontal Pod Autoscaler adjusts replicas based on CPU/RPS.
- **Frontend hosting**: Next.js deployed to Vercel or static hosting behind CDN for low latency; environment variables injected at build time.
- **Database**: Managed PostgreSQL (Neon) with read replicas for analytics; Prisma migrations manage schema.
- **Networking**: All ingress behind HTTPS load balancer (e.g., Azure Front Door) with WAF policies; private networking for DB/cache.

## 3. Data Flow

1. User authenticates → Next.js obtains JWT/refresh pair and hydrates Auth context.
2. UI requests data via SWR → JWT added to Authorization header → Express validates token and scopes permissions.
3. Domain service executes business logic, persists mutations with Prisma, emits audit logs, and optionally publishes events.
4. Event consumers deliver notifications, sync to external gateways, or feed analytics pipelines.
5. Monitoring agents ship traces/logs/metrics to the observability stack (OpenTelemetry + Prometheus/Grafana or Azure Monitor).

## 4. Non-Functional Requirements (NFRs)

| Category                  | Requirement                                                                                                  | Measurement / Notes                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Performance               | P95 API latency ≤ 300 ms for read operations, ≤ 600 ms for writes under 500 RPS.                             | Track with APM dashboards; regressions trigger alerts.                         |
| Scalability               | Support 200 concurrent stores, burst to 5× baseline traffic without manual intervention.                     | Auto-scale frontend edge nodes and backend pods based on CPU + queue depth.    |
| Availability & Resilience | 99.9% monthly uptime; zero data loss on single AZ failure.                                                   | Multi-AZ DB + backups; health probes + rolling deploys.                        |
| Backup & DR               | Point-in-time recovery within 15 minutes; weekly DR drills verifying restore to new region.                  | Automated PITR for PostgreSQL, storage snapshots copied cross-region.          |
| Security                  | Enforce least privilege RBAC, MFA for operators, encrypted data in transit and at rest, quarterly pen tests. | OWASP ASVS L2 alignment; secrets stored in cloud key vault.                    |
| Compliance & Audit        | Immutable audit log for auth, RBAC, inventory, and financial events retained 7 years.                        | Append-only storage + log shipping to SIEM.                                    |
| Observability             | 100% of requests traced, logs structured (JSON), SLO dashboards published to ops.                            | OpenTelemetry instrumentation and log schemas enforced in CI.                  |
| Maintainability           | Changes require <15 min rollback; lint/test suites under 5 minutes locally.                                  | Enforced via CI gates, feature flag strategy, and automated regression suites. |
| Supportability            | Critical incidents acknowledged within 15 minutes, resolved or mitigated within 1 hour.                      | On-call rotation with runbooks in `docs/`.                                     |

## 5. Stakeholder Sign-off Checklist

- Architecture diagram reviewed by Engineering + Product.
- NFR table stored in version control (this document) and linked from onboarding docs.
- Updates require PR approval from Tech Lead or Architect.
