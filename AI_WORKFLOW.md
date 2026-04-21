# AI Workflow

This assignment follows the official GitHub Spec-Kit phase model, adapted to an existing
brownfield repository and executed with an agentic coding workflow plus micro-verification.

## Official Spec-Kit Workflow Mapping

Official Spec-Kit documentation describes the core flow as:

1. `specify init`
2. `/speckit.constitution`
3. `/speckit.specify`
4. `/speckit.clarify`
5. `/speckit.checklist`
6. `/speckit.plan`
7. `/speckit.tasks`
8. `/speckit.analyze`
9. `/speckit.implement`

This repository maps to that workflow as follows:

- Project scaffolding and templates live under `.specify/`
- Governing principles live in `.specify/memory/constitution.md`
- The active feature package lives in `specs/001-p2p-payment-request/`
- Feature definition lives in `specs/001-p2p-payment-request/spec.md`
- Clarification and requirement completeness are captured in
  `specs/001-p2p-payment-request/checklists/requirements.md`
- Technical planning lives in `specs/001-p2p-payment-request/plan.md`
- Task breakdown lives in `specs/001-p2p-payment-request/tasks.md`
- Implementation verification is enforced by tests, builds, and `scripts/verify-specs.js`

## Why The Repo Uses A Localized Spec-Kit Setup

- The project already existed as a brownfield Node, Postgres, and React codebase.
- Official GitHub Spec-Kit templates were brought into the repo under `.specify/`.
- The active feature artifacts were generated and maintained in the expected feature package
  layout under `specs/001-p2p-payment-request/`.
- The resulting workflow is Spec-Kit-compatible and reviewer-visible inside the repository, even
  though the work was not driven from a fresh greenfield initialization.

## Official Initialization Proof

The repository now also contains official local initialization traces from the real Specify CLI:

- `.specify/init-options.json` records `integration: "codex"` and `speckit_version: "0.7.4.dev0"`
- `.specify/scripts/powershell/` contains the generated PowerShell automation scripts
- `.specify/workflows/speckit/workflow.yml` contains the bundled workflow definition
- `.agents/skills/speckit-*` contains the Codex-facing Spec-Kit skills installed by `specify init`

## Process Summary

1. Audit the brownfield repo before changing code.
2. Capture the active feature in a Spec-Kit-style package under `specs/001-p2p-payment-request/`.
3. Repair backend contract and data integrity first.
4. Build the frontend only after the backend compiled and passed smoke checks.
5. Replace stale generated artifacts that were causing false signals in tests and builds.
6. Finish by aligning README, quickstart, contract docs, and deployment handoff files.

## Agent Usage

- Parallel explorer agents were used to audit backend, frontend, and delivery gaps independently.
- A worker agent was used to scaffold the Spec-Kit-style documentation package.
- Main implementation and verification stayed in the primary agent thread to avoid overlapping
  edits on the same files.

## Verification Style

The guiding rule was: do not move to the next larger milestone until the current smaller unit is
proven to work.

Examples from this repo:

- Backend TypeScript build was fixed before any frontend work continued.
- Real Postgres schema and seed verification was done before API smoke testing.
- API smoke verification was done before React routing and dashboard work.
- Backend tests were rewritten and cleaned before final delivery docs were updated.

## Tools And Constraints

- Official GitHub Spec-Kit templates were cloned locally and adapted into `.specify/` and `specs/`.
- MCP discovery was attempted, but no MCP resources were available in this session.
- Frontend state uses custom React hooks in `frontend/src/hooks/`.
- E2E coverage was completed with a custom browser runner and reviewer-facing video artifacts in
  `tests/e2e/artifacts/`.

## AI Prompt Themes

The work was driven by short task-focused prompts rather than one monolithic prompt:

- Audit current repo against assignment requirements
- Repair backend contract and transaction correctness
- Replace starter frontend with production-style assignment UI
- Rewrite failing tests against the real API contract
- Align docs, runbooks, and delivery metadata with the actual implementation
