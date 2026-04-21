# Feature Specification: Lovie P2P Payment Request

**Feature Branch**: `[001-p2p-payment-request]`  
**Created**: 2026-04-20  
**Status**: Implemented, verified, and deployed  
**Input**: User description: "Deliver the Lovie assignment as a serious Spec-Kit-driven P2P payment request submission on the existing Node/Fastify/React/Postgres repository."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request And Settle Money (Priority: P1)

An authenticated Lovie user can request money from another registered user by entering an
email address or phone number, an amount, and an optional memo, and the recipient can settle
that request from their own account balance.

**Why this priority**: This is the core assignment value. Without a complete request and payment
flow, the repo does not demonstrate the central Lovie use case.

**Independent Test**: Log in as `alice@lovie.com`, create a request to `bob@lovie.com`, then log
in as Bob and pay it. The request becomes `PAID`, both balances change, and the updated request
is visible from the detail endpoint.

**Acceptance Scenarios**:

1. **Given** Alice is authenticated and Bob already exists, **When** Alice submits a valid
   request for `$42.50` with a memo, **Then** the system creates a `PENDING` request with a
   unique ID, seven-day expiry, and shareable link.
2. **Given** Bob is the assigned recipient of a pending request and has sufficient funds,
   **When** Bob chooses Pay, **Then** the request becomes `PAID` and both account balances are
   updated atomically.
3. **Given** a request is pending but the recipient lacks funds, **When** the recipient chooses
   Pay, **Then** the system rejects the action and leaves the request status and balances
   unchanged.

---

### User Story 2 - Track Incoming And Outgoing Requests (Priority: P2)

An authenticated user can view separate incoming and outgoing request queues, search by the
counterparty, and filter by status so they can manage what they owe and what they are owed.

**Why this priority**: Once money can be requested, users need visibility into request status to
understand whether follow-up is required. This is the next most important assignment slice.

**Independent Test**: Seed the database, log in as `alice@lovie.com`, and confirm Alice can see
incoming and outgoing requests with `PENDING`, `PAID`, `DECLINED`, and `EXPIRED` states, then
filter to one status and search for a counterparty email.

**Acceptance Scenarios**:

1. **Given** the database contains seeded requests in multiple states, **When** Alice opens the
   dashboard, **Then** incoming and outgoing requests are shown separately with amount, status,
   memo, timestamps, and remaining time.
2. **Given** Alice filters by `PENDING`, **When** the list reloads, **Then** only pending requests
   are shown and pagination metadata remains accurate.
3. **Given** Alice searches for `bob@lovie.com`, **When** the query executes, **Then** only
   requests involving Bob are returned in the relevant list.

---

### User Story 3 - Resolve Exceptions And Stale Requests (Priority: P3)

Users can decline or cancel pending requests, and the system automatically treats stale requests
as expired so no one can take an invalid action on old data.

**Why this priority**: The assignment is incomplete if requests can be created but cannot be
rejected, cancelled, or safely prevented from being acted on after expiry.

**Independent Test**: Create one pending request, decline it as the recipient, create another and
cancel it as the requester, then load an already expired request and confirm all actions are
blocked and the status is `EXPIRED`.

**Acceptance Scenarios**:

1. **Given** Bob receives a pending request from Alice, **When** Bob chooses Decline, **Then** the
   request becomes `DECLINED` and remains visible in both histories.
2. **Given** Alice owns a pending request, **When** Alice chooses Cancel, **Then** the request
   becomes `CANCELLED` and no recipient action is allowed afterward.
3. **Given** a pending request has passed its expiry time, **When** either participant loads or
   attempts to action it, **Then** the system marks it `EXPIRED` and rejects further state
   changes.

---

### Edge Cases

- What happens when the requester enters their own email address or phone number?
- What happens when the recipient identifier does not match any existing user?
- How does the system handle a request with more than two decimal places or more than
  `999,999.99`?
- How does the system handle an action on a request that is already `PAID`, `DECLINED`,
  `CANCELLED`, or `EXPIRED`?
- What happens when a user tries to access another user's request detail by guessing an ID?
- What happens when the frontend still shows a pending request but the backend has already expired
  it?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a user to authenticate with a valid email address and receive
  a bearer token for the current browser session.
- **FR-002**: The system MUST auto-provision a demo user account with a default USD balance when a
  valid email logs in for the first time in the assignment environment.
- **FR-003**: The system MUST allow an authenticated user to create a payment request by supplying
  a recipient email or phone number, an amount, a currency, and an optional memo.
- **FR-004**: The system MUST reject request creation when the recipient cannot be found, the
  requester targets themselves, the amount is invalid, the currency is unsupported, or the memo is
  unsafe.
- **FR-005**: The system MUST set every newly created request to `PENDING` and set an expiry time
  exactly seven days after creation.
- **FR-006**: The system MUST expose separate incoming and outgoing request lists for the current
  user.
- **FR-007**: The system MUST support list filtering by status and searching by counterparty email
  or phone number.
- **FR-008**: The system MUST expose a request-detail view that includes both participants,
  timestamps, expiration metadata, and a shareable link.
- **FR-009**: The system MUST allow only the assigned recipient to pay or decline a pending
  request.
- **FR-010**: The system MUST allow only the original requester to cancel a pending request.
- **FR-011**: The system MUST reject pay, decline, or cancel actions for any request that is no
  longer pending.
- **FR-012**: The system MUST reject payment when the recipient account balance is lower than the
  request amount.
- **FR-013**: The system MUST update both account balances and request status atomically when a
  payment succeeds.
- **FR-014**: The system MUST expire stale pending requests before returning list, detail, or
  action results.
- **FR-015**: The system MUST return consistent API payloads for create, list, detail, pay,
  decline, and cancel so the frontend can refresh from the server response without guessing state.
- **FR-016**: The system MUST provide a seeded demo dataset and runbook so reviewers can validate
  all primary statuses locally.
- **FR-017**: The hosted API MUST apply the schema at startup and seed demo data only when the
  connected database is empty so public deployments remain reviewer-ready without manual SQL steps.

### Key Entities *(include if feature involves data)*

- **User**: A registered Lovie participant identified by email and phone number and used as either
  a requester or recipient.
- **Account**: A single USD balance owned by one user and adjusted when a request is paid.
- **Payment Request**: A money request linking a requester, a recipient, an amount, a memo, a
  lifecycle status, and an expiry timestamp.
- **Session**: A short-lived bearer-token record that maps an authenticated browser session to a
  user in the assignment environment.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can start the backend, seed the database, and create a new payment
  request in under 10 minutes using the documented quickstart steps.
- **SC-002**: A successful Pay action updates the request status and both account balances on the
  next API response with no manual database intervention.
- **SC-003**: Reviewers can observe all four key terminal outcomes (`PAID`, `DECLINED`,
  `CANCELLED`, `EXPIRED`) using only the seeded dataset and documented manual flows.
- **SC-004**: Unauthorized, invalid, and insufficient-funds actions always produce a non-2xx API
  response and leave persisted monetary state unchanged.

## Assumptions

- This assignment uses mock email authentication instead of password or magic-link delivery.
- The Lovie submission is a local demo and does not require external payment processors,
  notifications, or background job infrastructure.
- USD is the only supported currency for the assignment build.
- The repository keeps the backend at the root and the React client under `frontend/`.
- The local verification baseline is `npm test`, root `npm run build`, frontend
  `npm run lint && npm run build`, and `npm run e2e`.
- Hosted deployments may use a managed PostgreSQL database that starts empty, so bootstrap must be
  safe and idempotent.
