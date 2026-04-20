<!--
Sync Impact Report
- Version change: none -> 1.0.0
- Modified principles: initial ratification
- Added sections: Core Principles, Assignment Constraints, Workflow Expectations, Governance
- Removed sections: none
- Templates requiring updates:
  - [x] .specify/templates/constitution-template.md
  - [x] .specify/templates/spec-template.md
  - [x] .specify/templates/plan-template.md
  - [x] .specify/templates/tasks-template.md
  - [x] .specify/templates/checklist-template.md
- Follow-up TODOs: none
-->

# Lovie P2P Payment Constitution

## Core Principles

### I. Spec-First Delivery
Every change that affects product behavior, delivery scope, or acceptance criteria MUST be
traceable to an active feature directory under `specs/`. `spec.md`, `plan.md`, and `tasks.md`
are the authoritative sequence for defining work: intent first, design second, execution last.
Implementation or delivery notes that cannot be traced back to the active feature are out of
scope until the spec is amended.

### II. Contract Before Coupling
Any backend or frontend behavior that crosses a process boundary MUST be described in
`contracts/openapi.yaml` before or alongside implementation. Request and response shapes,
authentication expectations, and error codes MUST stay aligned across Fastify handlers,
frontend API clients, tests, and quickstart examples. Backward-incompatible contract changes
require an explicit note in the feature plan and README.

### III. Monetary Safety Is Non-Negotiable
Payment request state changes and balance transfers MUST enforce identity checks, terminal-state
guards, expiration checks, and atomic persistence. A request can move from `PENDING` to exactly
one terminal state. Any flow that moves funds MUST complete within a database transaction and
leave accounts balanced if the operation fails.

### IV. Assignment-Grade Verification
Each prioritized user story MUST define an independent validation path using repository-native
evidence such as unit tests, integration tests, seeded demo data, curl examples, or quickstart
steps. Verification for money movement MUST cover authorization, insufficient funds, expired
requests, and status propagation to both sides of the request.

### V. Brownfield Respect
The existing repository layout is a constraint, not a suggestion. Work MUST fit the current
Node/Fastify API at the repository root, the React/Vite client under `frontend/`, and the
Postgres schema in `schema.sql`. Documentation MUST describe the real repository state,
including gaps, rather than inventing a cleaner architecture that does not exist.

## Assignment Constraints

- The assignment build uses mock email login, in-memory bearer sessions, and seeded/demo users.
- The assignment build supports `USD` only.
- Payment requests expire seven days after creation unless actioned first.
- Recipient lookup uses an existing email address or phone number already present in `users`.
- Notes are optional, limited to 280 characters, and must reject HTML-like content.
- Local development uses PostgreSQL 15 via Docker Compose unless `DATABASE_URL` overrides it.

## Workflow Expectations

- `.specify/feature.json` MUST point at the active feature directory before planning or task
  generation continues.
- `research.md`, `data-model.md`, `quickstart.md`, and `contracts/openapi.yaml` MUST exist
  before the feature is considered ready for implementation handoff.
- Tasks MUST be grouped by user story so one slice can be demonstrated without completing the
  full backlog.
- README updates MUST explain how to run the current repo as-is, including any temporary limits
  in the frontend or auth model.

## Governance

This constitution supersedes ad hoc repo notes when there is a conflict about scope, delivery
order, or quality gates for the Lovie submission. Amendments MUST be made in the same change set
as any dependent template or README updates.

Versioning follows semantic rules:

- MAJOR: removes or redefines a principle in a way that changes required behavior.
- MINOR: adds a principle or materially expands mandatory workflow requirements.
- PATCH: clarifies wording without changing required behavior.

Every review of spec or delivery artifacts MUST check compliance with this constitution. Any
approved exception MUST be recorded in the active `plan.md` under `Complexity Tracking`.

**Version**: 1.0.0 | **Ratified**: 2026-04-20 | **Last Amended**: 2026-04-20
