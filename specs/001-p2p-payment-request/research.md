# Research: Lovie P2P Payment Request

## Decision 1: Preserve The Existing Brownfield Split

- **Decision**: Keep the Fastify API and PostgreSQL access layer at the repository root and use
  `frontend/` as the only browser client package.
- **Rationale**: The backend already exposes the needed request lifecycle routes and schema. A
  brownfield plan avoids unnecessary repo churn and keeps the submission honest about current
  architecture.
- **Alternatives considered**:
  - Move backend code into a new `backend/` directory. Rejected because it adds structural noise
    without improving the assignment outcome.
  - Merge frontend code into the root application. Rejected because the Vite package already
    exists and provides a clean client boundary.

## Decision 2: Keep Assignment Authentication Lightweight

- **Decision**: Continue using email-only login that auto-creates a demo user and returns an
  in-memory bearer token for the current process.
- **Rationale**: This keeps reviewer setup simple and matches the repository's current backend
  behavior. It is sufficient for a local assignment demo.
- **Alternatives considered**:
  - Password-based auth. Rejected as unnecessary scope for the assignment.
  - Real magic-link delivery. Rejected because no mail provider or callback infrastructure exists
    in the repo.

## Decision 3: Use Opportunistic Expiry Instead Of A Scheduler

- **Decision**: Expire stale requests inside list, detail, and action flows before data is returned
  or changed.
- **Rationale**: The current service already calls `expireStaleRequests()` in read and action
  paths, which guarantees consistent behavior without adding a worker process.
- **Alternatives considered**:
  - Cron or background jobs. Rejected because the repo has no worker runtime and the assignment
    does not require asynchronous infrastructure.

## Decision 4: Make `PaymentRequestDetails` The Canonical API Shape

- **Decision**: Treat the detailed request payload as the canonical response for create, detail,
  pay, decline, and cancel operations, and use paginated collections of the same shape for list
  endpoints.
- **Rationale**: The backend already returns rich participant and expiry metadata. Returning the
  same shape after state changes lets the frontend refresh directly from the server response.
- **Alternatives considered**:
  - Return status-only payloads for decline or cancel. Rejected because it creates client-side
    branching and contradicts the existing backend behavior.
  - Maintain separate list and detail models with divergent fields. Rejected because the list
    views still need expiry and participant metadata.

## Decision 5: Preserve Transactional Payment Fulfillment

- **Decision**: Keep payment fulfillment in a single database transaction using row-level locking
  and optimistic-versioned account updates.
- **Rationale**: Paying a request is the only operation that moves money. The current service
  design correctly prioritizes atomic balance updates over implementation simplicity.
- **Alternatives considered**:
  - Two separate balance updates without a transaction. Rejected because partial writes would be
    possible if one update fails.
  - Eventual consistency via a queue. Rejected because the assignment requires deterministic local
    verification, not asynchronous processing.

## Decision 6: Treat The Frontend As The Main Remaining Delivery Gap

- **Decision**: The feature plan should focus the remaining implementation work on replacing the
  starter `frontend/src/App.tsx` with login, create-request, list, detail, and action screens.
- **Rationale**: The backend, schema, and seed scripts are already concrete. The biggest gap
  between the current repo and a complete Lovie submission is the missing React experience.
- **Alternatives considered**:
  - Re-document the repo as API-only. Rejected because the assignment architecture explicitly
    includes React and the repository already contains a frontend package.
  - Hide the frontend gap. Rejected because the constitution requires brownfield honesty.
