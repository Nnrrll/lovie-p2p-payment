---
description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include test tasks whenever the specification requires verification for a story.

**Organization**: Tasks are grouped by user story to preserve independent delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Which user story the task belongs to (e.g. `US1`)
- Include exact file paths in descriptions

## Phase 1: Setup

- [ ] T001 Capture or confirm repo setup required for the feature
- [ ] T002 Create or update shared documentation and contract artifacts

---

## Phase 2: Foundational

- [ ] T003 Establish blocking infrastructure needed by all stories
- [ ] T004 [P] Add or align verification coverage for the feature contract

---

## Phase 3: User Story 1 - [Title] (Priority: P1)

**Goal**: [Story goal]

**Independent Test**: [How to verify this story alone]

- [ ] T005 [P] [US1] Add story-specific tests in [path]
- [ ] T006 [P] [US1] Implement supporting data or client changes in [path]
- [ ] T007 [US1] Deliver the primary story flow in [path]

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Story goal]

**Independent Test**: [How to verify this story alone]

- [ ] T008 [P] [US2] Add story-specific tests in [path]
- [ ] T009 [P] [US2] Implement supporting changes in [path]
- [ ] T010 [US2] Deliver the story flow in [path]

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Story goal]

**Independent Test**: [How to verify this story alone]

- [ ] T011 [P] [US3] Add story-specific tests in [path]
- [ ] T012 [P] [US3] Implement supporting changes in [path]
- [ ] T013 [US3] Deliver the story flow in [path]

---

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T014 [P] Update README.md and quickstart.md if implementation changed run steps
- [ ] T015 Run the manual and automated verification listed in quickstart.md

## Dependencies & Execution Order

- Setup must complete before foundational work.
- Foundational work must complete before user stories.
- User stories may proceed in parallel after foundational work if capacity exists.
- Polish follows all desired story work.

## Implementation Strategy

### MVP First

1. Finish Setup.
2. Finish Foundational work.
3. Deliver User Story 1.
4. Validate before proceeding.

### Incremental Delivery

1. Ship User Story 1 as the first demonstrable slice.
2. Layer User Story 2 without regressing User Story 1.
3. Layer User Story 3 and polish after the primary flows are stable.
