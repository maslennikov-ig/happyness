# Technical Context

## Stack Overview

- **Frontend:**
  - TypeScript 5.5+
  - React 19+, Next.js 15+ (App Router, Server Components)
  - Tailwind CSS 4+, shadcn/ui, React Hook Form + Zod
  - TanStack Query, Zustand/Jotai, Framer Motion
- **Backend:**
  - TypeScript 5.5+
  - Node.js 22+, NestJS 11+, Prisma ORM 6+
  - PostgreSQL 17+, Redis 7+
  - Nodemailer, React-email
- **CI/CD:**
  - GitHub Actions, Docker, Docker Compose
  - Automated tests, migration, deployment pipelines
- **Testing:**
  - Vitest, Supertest, Testing Library (React, jest-dom, user-event)

## Environment Setup

- Node.js 18+ required (see [README.md](../README.md))
- Docker/Docker Compose for DB and Redis
- .env file for environment variables (see .env.example)
- Prisma for DB migrations

## Constraints

- Modular monorepo, strict API contracts
- All modules must be independently testable
- Security: JWT, role-based access, PCI DSS for payments, secure cookies, CSRF, rate limiting
- Accessibility: WCAG compliance
- All documentation in English (see Memory Bank rules)

## Dependencies

- See package.json for full list
- Key libraries: React, Next.js, NestJS, Prisma, PostgreSQL, Redis, shadcn/ui, Tailwind, TanStack Query, Zustand, Jotai, Framer Motion, Nodemailer, React-email, Vitest, Supertest

## References

- [Stack Docs: context7.md](./context7.md)
- [Technical Specification: TZ.md](./TZ.md)
- [Setup Guide: README.md](../README.md)
- [Architecture](./architecture.md)

---

_Last updated: 2025-05-22_
