# AGENTS.md

## Active Spec Context

- Active feature directory: `specs/001-p2p-payment-request`
- Constitution: `.specify/memory/constitution.md`
- Canonical API contract:
  `specs/001-p2p-payment-request/contracts/openapi.yaml`

## Repository Shape

- Root `src/` contains the Fastify API and PostgreSQL access layer.
- `frontend/` contains the React and Vite client.
- `scripts/` owns local database setup and seeding.
- `tests/` contains repository-native verification for backend behavior.

## Agent Roles Used

- Primary coding agent: owned the main implementation, verification, deployment alignment, and
  final documentation updates.
- Explorer-style agents: used for bounded repo inspection, gap analysis, and targeted codebase
  discovery.
- Worker-style agents: used for focused implementation or documentation scaffolding when a bounded
  subtask could be isolated safely.
- Spec-Kit-installed skills under `.agents/skills/`: provided the reusable agent workflows for
  specify, plan, tasks, analyze, implement, and related git support commands.

## Working Rules

- Start from `spec.md`, then `plan.md`, then `tasks.md` before changing scope.
- Keep `quickstart.md`, `README.md`, and `openapi.yaml` in sync with any API or runbook changes.
- Treat `PaymentRequestDetails` as the canonical response shape for create, detail, pay, decline,
  and cancel flows unless the active spec is amended.
- Be explicit about brownfield reality: the backend and frontend are both now implemented, so the
  remaining work is usually verification, deployment, or documentation alignment.
- Do not invent infrastructure that is not present in the repo unless the active plan justifies it.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
