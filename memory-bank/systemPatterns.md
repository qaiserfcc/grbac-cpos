# System Patterns

## Architectural Patterns

- **Layered Architecture**: The system follows a layered architecture with distinct separation between presentation (Next.js frontend), business logic (Express.js backend with controllers and services), and data access (Prisma ORM with PostgreSQL). This ensures modularity, testability, and scalability.
- **Client-Server Architecture**: Frontend acts as the client consuming RESTful APIs from the backend server, enabling decoupled development and deployment.
- **RESTful API Design**: Backend exposes RESTful endpoints for CRUD operations on users, roles, products, and categories, following standard HTTP methods (GET, POST, PATCH, DELETE).

## Design Patterns

- **Repository Pattern**: Prisma ORM serves as the repository layer, abstracting database operations and providing a consistent interface for data access across the application.
- **Middleware Pattern**: Express.js middleware is used for cross-cutting concerns like authentication (JWT verification), authorization (RBAC checks), and error handling.
- **Observer Pattern**: SWR (React library) implements an observer pattern for data fetching, caching, and automatic revalidation, keeping the UI in sync with backend state.
- **Strategy Pattern**: Different authentication strategies (e.g., JWT-based login) and permission checks are implemented using pluggable strategies in the RBAC service.
- **Factory Pattern**: User and role creation logic in controllers uses factory-like patterns to instantiate objects with default values and validations.

## Common Idioms

- **Async/Await**: Asynchronous operations in Node.js backend (e.g., database queries, API calls) use async/await for readable, non-blocking code.
- **Dependency Injection**: Services and middleware are injected into controllers and routes, promoting loose coupling and easier testing.
- **Error Handling with Try-Catch**: Controllers wrap business logic in try-catch blocks, using custom error handlers to standardize API responses.
- **Schema Validation**: Zod schemas are used idiomatically for input validation in API endpoints, ensuring data integrity and providing clear error messages.
- **Component Composition**: React components in the frontend use composition patterns, combining smaller UI components (e.g., buttons, modals) for reusable and maintainable interfaces.
