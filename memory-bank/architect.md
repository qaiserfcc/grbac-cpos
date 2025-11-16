# MemoriPilot: System Architect

## Overview

This file contains the architectural decisions and design patterns for the Cloud POS (GRBAC-enabled Point of Sale) project.

## Architectural Decisions

1. **Frontend Framework Selection**: Chose Next.js 16 with React 19 for the frontend due to its server-side rendering capabilities, built-in routing, and strong TypeScript support, enabling fast, scalable web applications with excellent SEO and performance.
2. **Backend Framework**: Selected Express.js with TypeScript for the backend to provide a lightweight, flexible API server that integrates well with middleware for authentication and authorization.
3. **Database and ORM**: Adopted Prisma ORM with PostgreSQL for type-safe database interactions, migrations, and schema management, ensuring data integrity and developer productivity.
4. **Authentication and Authorization**: Implemented JWT-based authentication with custom RBAC middleware to secure API endpoints and control user permissions granularly.
5. **State Management**: Used SWR for client-side data fetching and caching in the frontend, providing automatic revalidation and optimistic updates without complex state management libraries.
6. **Testing Strategy**: Employed Playwright for E2E testing across multiple browsers, Jest for unit tests, and integrated CI/CD for automated quality checks.
