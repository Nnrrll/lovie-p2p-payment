# Implementation Plan: Lovie P2P Payment Request

**Branch**: `[001-p2p-payment-request]` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-p2p-payment-request/spec.md`

## Summary

Deliver the Lovie assignment as an end-to-end P2P payment request demo by preserving the existing
Fastify and PostgreSQL backend at the repository root, formalizing its contract in OpenAPI, and
using the sibling React/Vite app in `frontend/` to replace the starter UI with the request,
dashboard, and lifecycle flows defined in the specification.

## Technical Context

**Language/Version**: TypeScript 6.x on Node.js for backend and frontend  
**Primary Dependencies**: Fastify 5.8.5, pg 8.20.0, React 19.2.5, React DOM 19.2.5,
React Router DOM 7.14.1, Vite 8.0.9  
**Storage**: PostgreSQL 15 via `docker-compose.yml` or `DATABASE_URL`  
**Testing**: Vitest 4.x, Supertest 7.x, pg-backed unit and integration tests, manual quickstart
API verification  
**Target Platform**: Local Docker/Postgres, localhost Fastify API, and modern desktop browsers  
**Project Type**: Brownfield web application with a root API service and sibling frontend package  
**Performance Goals**: Local auth, list, detail, and action endpoints respond fast enough for an
interactive demo; list endpoints stay responsive against seeded assignment data  
**Constraints**: Mock email auth, in-memory sessions, USD-only support, memo length 280, maximum
amount `999,999.99`, list limit 50, seven-day expiry, no background worker  
**Scale/Scope**: Assignment demo for a small seeded user base and low-volume request histories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I - Spec-First Delivery**: PASS. Active feature directory is
  `specs/001-p2p-payment-request` and all downstream artifacts are captured here.
- **Principle II - Contract Before Coupling**: PASS with follow-up. The backend already returns a
  rich `PaymentRequestDetails` payload; the OpenAPI contract in this feature makes that canonical
  and the frontend client must be aligned during implementation.
- **Principle III - Monetary Safety Is Non-Negotiable**: PASS. The current payment flow already
  uses a database transaction, balance checks, and state guards. Future changes must preserve those
  invariants.
- **Principle IV - Assignment-Grade Verification**: PASS. This plan includes automated test
  alignment plus manual quickstart flows with seeded users.
- **Principle V - Brownfield Respect**: PASS. The plan keeps the root Fastify API, the current
  `schema.sql`, and the separate `frontend/` package while replacing the starter frontend with the
  assignment UI.

**Post-Design Re-check**: PASS. `research.md`, `data-model.md`, `quickstart.md`, and
`contracts/openapi.yaml` close the remaining contract and runbook gaps without changing the repo
shape.

## Project Structure

### Documentation (this feature)

```text
specs/001-p2p-payment-request/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- openapi.yaml
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   `-- index.ts
|-- db/
|   `-- index.ts
|-- lib/
|   |-- http-error.ts
|   `-- validation.ts
|-- repositories/
|   |-- account.repo.ts
|   |-- payment-request.repo.ts
|   `-- user.repo.ts
|-- services/
|   `-- payment-request.service.ts
`-- types/
    |-- api.ts
    `-- index.ts

scripts/
|-- setup-db.ts
`-- seed-db.ts

tests/
|-- integration/
|   `-- api.test.ts
`-- unit/
    |-- account.repo.test.ts
    |-- decline-request.test.ts
    |-- fulfill-request.test.ts
    |-- infra.test.ts
    |-- payment-request.repo.test.ts
    |-- payment-request.service.test.ts
    `-- user.repo.test.ts

frontend/
|-- src/
|   |-- App.tsx
|   |-- components/
|   |   |-- AppHeader.tsx
|   |   |-- RequestCard.tsx
|   |   |-- RequestComposer.tsx
|   |   `-- StatusPill.tsx
|   |-- hooks/
|   |   |-- useCountdown.ts
|   |   |-- useRequestDetail.ts
|   |   |-- useRequestList.ts
|   |   `-- useSession.ts
|   |-- index.css
|   |-- lib/
|   |   |-- api.ts
|   |   `-- format.ts
|   |-- pages/
|   |   |-- DashboardPage.tsx
|   |   |-- LoginPage.tsx
|   |   `-- RequestDetailPage.tsx
|   `-- main.tsx
`-- package.json
```

**Structure Decision**: Keep the brownfield split that already exists. The backend remains a
single Fastify service rooted in `src/`, and the assignment UI is completed inside the sibling
`frontend/` Vite application rather than moving code into a monorepo or introducing a second API.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | n/a | The current repo layout already supports the assignment without structural exceptions |
