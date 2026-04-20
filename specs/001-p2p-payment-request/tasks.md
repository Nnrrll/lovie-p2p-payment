---
description: "Task list for completing the Lovie P2P payment request assignment flow"
---

# Tasks: Lovie P2P Payment Request

**Input**: Design documents from `/specs/001-p2p-payment-request/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`

**Tests**: Test work is required because the specification explicitly calls for assignment-grade
verification of authorization, request lifecycle handling, and money movement.

**Organization**: The API, schema, and seed scripts already exist. This task list focuses on
contract alignment, verification hardening, and completion of the React delivery.

## Phase 1: Setup

- [x] T001 Confirm `.specify/feature.json` points to `specs/001-p2p-payment-request` and keep
      `README.md` linked to the active feature package.
- [x] T002 [P] Freeze reviewer-facing examples in
      `specs/001-p2p-payment-request/contracts/openapi.yaml` and
      `specs/001-p2p-payment-request/quickstart.md`.
- [x] T003 [P] Keep repo delivery metadata current in `README.md`, `.gitignore`, and `AGENTS.md`.

---

## Phase 2: Foundational

**Purpose**: Close blocking contract and verification gaps before the frontend stories start.

- [x] T004 [P] Align response typings and auth helpers in `frontend/src/lib/api.ts` with
      `contracts/openapi.yaml`, especially `getMe`, `declineRequest`, and `cancelRequest`.
- [x] T005 [P] Repair and expand API integration coverage in `tests/integration/api.test.ts` so
      tests target the live `/api/v1/...` routes instead of stale route variants.
- [x] T006 [P] Add or repair lifecycle coverage for pay, decline, cancel, expiry, and
      insufficient-funds paths in `tests/unit/fulfill-request.test.ts`,
      `tests/unit/decline-request.test.ts`, and related unit files.
- [x] T007 Establish the frontend assignment shell in `frontend/src/App.tsx`,
      `frontend/src/index.css`, and any new `frontend/src/components/` files needed by all stories.

**Checkpoint**: Contract and verification are trustworthy, and the React app is ready for feature
screens.

---

## Phase 3: User Story 1 - Request And Settle Money (Priority: P1)

**Goal**: Replace the starter UI with login, account context, and request-creation flow that can
demonstrate a real request from one demo user to another.

**Independent Test**: Log in as Alice, create a request to Bob, then log in as Bob and pay it.
Confirm the response and account summary reflect the successful settlement.

- [x] T008 [P] [US1] Add UI state for session persistence and login submission in
      `frontend/src/App.tsx`.
- [x] T009 [P] [US1] Implement authenticated account summary and current-user context using
      `frontend/src/lib/api.ts` and `frontend/src/App.tsx`.
- [x] T010 [US1] Replace the starter page with a create-request form, inline validation, and a
      success panel in `frontend/src/App.tsx`.
- [x] T011 [US1] Render the created request's shareable link, amount, expiry, and status in
      `frontend/src/App.tsx` so the MVP can be demonstrated without additional screens.

**Checkpoint**: User Story 1 is fully demoable and can stand as the MVP.

---

## Phase 4: User Story 2 - Track Incoming And Outgoing Requests (Priority: P2)

**Goal**: Give authenticated users visibility into the requests they owe and the requests they have
sent.

**Independent Test**: Log in as Alice against seeded data and confirm separate incoming and
outgoing queues support status filtering, counterparty search, and pagination.

- [x] T012 [P] [US2] Add typed outgoing and incoming list helpers with query parameters in
      `frontend/src/lib/api.ts`.
- [x] T013 [P] [US2] Build incoming and outgoing request sections with status chips and counterparty
      metadata in `frontend/src/App.tsx`.
- [x] T014 [US2] Add search and status filters in `frontend/src/App.tsx`.
- [x] T015 [US2] Format countdown and terminal-state display using `expires_in_seconds` and status
      metadata in `frontend/src/App.tsx`.

**Checkpoint**: User Story 2 is independently useful even before request-detail actions are added.

---

## Phase 5: User Story 3 - Resolve Exceptions And Stale Requests (Priority: P3)

**Goal**: Let users inspect a request in detail, act on it when authorized, and clearly understand
why invalid actions are blocked.

**Independent Test**: Bob can decline or pay his pending requests, Alice can cancel her own pending
requests, and expired requests show blocked actions with consistent messaging.

- [x] T016 [P] [US3] Add request-detail fetch and selection state in `frontend/src/lib/api.ts` and
      `frontend/src/App.tsx`.
- [x] T017 [P] [US3] Implement pay, decline, and cancel actions with server refresh in
      `frontend/src/App.tsx`.
- [x] T018 [US3] Surface insufficient-funds, unauthorized, and expired-request errors in
      `frontend/src/App.tsx`.
- [x] T019 [US3] Add a detail presentation that shows participants, timestamps, memo, shareable
      link, and terminal-state rules in `frontend/src/App.tsx`.

**Checkpoint**: All core assignment outcomes are now available through the React app.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [x] T020 [P] Reconcile any contract drift between `src/app/index.ts`, `frontend/src/lib/api.ts`,
      and `tests/integration/api.test.ts`.
- [x] T021 [P] Validate the reviewer runbook in `specs/001-p2p-payment-request/quickstart.md` and
      update `README.md` if startup or demo behavior changed.
- [x] T022 Run `npm test`, exercise the manual API flow in `quickstart.md`, and close any gaps
      against `spec.md` before submission.

## Dependencies & Execution Order

- Phase 1 has no dependencies and should be done first.
- Phase 2 blocks all frontend story work because the API contract and tests must be trustworthy.
- User Story 1 is the MVP and should land before User Stories 2 and 3.
- User Stories 2 and 3 can overlap after Phase 2 if one person focuses on list views and another
  focuses on request-detail actions.
- Final polish follows whichever stories are included in the submitted demo.

## Parallel Opportunities

- `T002` and `T003` can run in parallel because they touch different documentation artifacts.
- `T004`, `T005`, and `T006` can run in parallel because they target separate client and test
  files.
- `T012` and `T013` can run in parallel once the base app shell from `T007` exists.
- `T016` and `T017` can run in parallel once list rendering is available.

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational work.
2. Finish User Story 1.
3. Validate Alice -> Bob request creation and payment with the manual quickstart flow.
4. Stop here if only a minimum demonstrable assignment slice is required.

### Incremental Delivery

1. Land User Story 1 as the first submission-quality demo.
2. Add User Story 2 to make seeded data and status visibility reviewable.
3. Add User Story 3 to complete decline, cancel, and expiry handling.
4. Run the final verification pass before handing over the repo.
