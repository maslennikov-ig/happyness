# System Patterns

## Architecture Overview

Happyness is a modular, service-oriented web platform. The architecture is based on a core system (kernel) and pluggable functional modules. This enables independent development, scaling, and deployment of features.

- Modular monorepo structure (see [architecture.md](./architecture.md))
- Clear separation of core (user/company/auth, API, error handling) and modules (concierge, chat, payments, directory, templates, analytics, etc.)
- Each module communicates with the core via well-defined API contracts ([modules.md](./modules.md))

## Key Patterns & Practices

- **Modularity:** All features are implemented as independent modules, plugged into the kernel via interfaces
- **API-first:** Strict API contracts between core and modules, versioning, and error standardization
- **Role-based access:** Permissions and roles enforced throughout modules
- **CQRS & Event-driven:** Separation of read/write models and use of event bus for notifications, async operations
- **Dependency Injection:** (NestJS) for loose coupling and testability
- **Resilience & Observability:** Centralized logging, error tracking, monitoring
- **Scalability:** Stateless backend, containerization, horizontal scaling (Kubernetes-ready)

## Component Interactions

- Modules interact via core API: e.g., chat, requests, payments, directory, notifications
- Shared services: authentication, user management, caching, analytics
- UI components are reusable and consistent (see shadcn/ui usage)
- Data flows through Prisma ORM and PostgreSQL, with Redis for caching

## References

- [Architecture Overview](./architecture.md)
- [Module System](./modules.md)
- [API Contracts](./tasks/tasks1/task23_api_contracts.md)

---

_Last updated: 2025-05-22_
