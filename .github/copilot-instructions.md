```markdown

# Copilot Instructions for CPOS (Cloud POS)

## Overview
CPOS is a cloud-based POS system with a detailed, granular RBAC model. It manages stores, sales, inventory, customers, and other POS operations. The system is designed for scalability, modularity, and maintainability, with a focus on clear service boundaries and efficient data flows.

### Key Components
- **RBAC System**: Centralized role-based access control for managing permissions.
- **Inventory Management**: Tracks stock levels, updates, and alerts.
- **Sales Module**: Handles transactions, receipts, and reporting.
- **Customer Management**: Stores customer data and purchase history.
- **Integration Layer**: Interfaces with external services (e.g., payment gateways, analytics tools).

### Data Flow
- Data flows between modules via well-defined APIs.
- Persistent data is stored in a cloud database, with caching layers for performance.
- Event-driven architecture is used for asynchronous operations (e.g., notifications, stock updates).

### Structural Decisions
- Modular design ensures components can be developed and tested independently.
- Cloud-native architecture leverages scalability and fault tolerance.
- Code follows a domain-driven design (DDD) approach to align with business logic.

---

## Developer Workflows

### Build and Test
- **Build**: Use `npm run build` to compile the project.
- **Tests**: Run `npm test` for unit tests and `npm run test:e2e` for end-to-end tests.
- **Debugging**: Use the integrated terminal in VS Code with breakpoints set in the active document.

### Debugging Tips
- Use the `output` pane to view logs during test runs.
- Check the `logs/` directory for detailed error reports.

---

## Project-Specific Conventions

### Code Patterns
- **Service Layer**: Each service has a dedicated directory under `src/services/`.
- **API Contracts**: Defined in `src/contracts/` and shared across modules.
- **Error Handling**: Use the `ErrorHandler` utility in `src/utils/`.

### Naming Conventions
- Files: Use `kebab-case` for filenames.
- Variables: Use `camelCase` for variables and `PascalCase` for classes.

### Integration Points
- External APIs: Defined in `src/integrations/`.
- Cross-component communication: Use event emitters in `src/events/`.

---

## Task Management with Autoplans

This project uses **autoplans.dev Language Model Tools** for intelligent task management. AI agents can:

### Available Autoplans Tools
```typescript
// Project Management
autoplans_list_projects()
autoplans_create_project({name, description})
autoplans_get_project({projectId})

// Task Management  
autoplans_list_tasks({projectId})
autoplans_create_task({projectId, title, description, priority, type})
autoplans_update_task({taskId, status, priority, ...})
autoplans_delete_task({taskId})
autoplans_get_task({taskId})

// Bulk Operations
autoplans_bulk_create_tasks({projectId, tasks: []})
autoplans_bulk_update_tasks({projectId, taskIds: [], updates: {}})

// Repository Sync
autoplans_generate_copilot_config()
autoplans_initialize_autoplans_folder()
autoplans_sync_project_to_repo()
```

### Task Management Guidelines
1. **Before starting work**: Use `autoplans_list_tasks()` to check assigned tasks.
2. **Creating tasks**: Use appropriate `type` (coding/design/documentation/testing) and `priority`.
3. **Updating progress**: Update task status (e.g., `pending → in_progress → completed`).
4. **Planning features**: Break down large features into smaller tasks using `autoplans_bulk_create_tasks()`.

---

## Memory Bank Usage

### Memory Bank Files
- `memory-bank/productContext.md`: High-level product goals and context.
- `memory-bank/activeContext.md`: Current state of the project.
- `memory-bank/systemPatterns.md`: Common patterns and practices.
- `memory-bank/decisionLog.md`: Records of architectural decisions.
- `memory-bank/progress.md`: Tracks ongoing work and milestones.

### Workflow
1. Check if the `memory-bank/` directory exists.
2. Read files in the order listed above to gather context.
3. Update memory bank files if significant changes occur during tasks.
4. Set the Memory Bank status to `[MEMORY BANK: ACTIVE]` when in use.

---

## Best Practices
- Commit changes frequently after passing all tests.
- Document significant changes in `memory-bank/decisionLog.md`.
- Follow the project's modular design principles to ensure maintainability.
```