# Lovie P2P Payment Request

Spec-Kit-driven implementation of the Lovie first interview assignment. The repo now contains a
working Fastify and PostgreSQL backend, a React and Vite frontend that covers the full request
money flow, automated backend verification, and a reviewer-friendly documentation package under
`specs/001-p2p-payment-request/`.

## Project Overview

This build implements:

- Mock email authentication with session-scoped persistence
- Payment request creation with email or phone recipient lookup
- Incoming and outgoing dashboards with search and status filters
- Request detail view with pay, decline, and cancel actions
- Simulated payment processing with delayed confirmation
- Seven-day expiration handling and countdown display
- PostgreSQL-backed state with atomic balance updates

## Live Demo URL

- Frontend: `https://lovie-p2p-payment-beige.vercel.app`
- Backend health: `https://lovie-p2p-payment-api.onrender.com/health`

## Local Setup

### 1. Start PostgreSQL

```powershell
docker compose up -d db
```

### 2. Install dependencies

```powershell
npm install
Set-Location frontend
npm install
Set-Location ..
```

### 3. Prepare the database

```powershell
npm run db:setup
npm run db:seed
```

### 4. Start the backend

```powershell
$env:CORS_ORIGIN = 'http://localhost:5173'
$env:APP_BASE_URL = 'http://localhost:5173'
npm run dev
```

### 5. Start the frontend

```powershell
Set-Location frontend
npm run dev
```

The app will be available at `http://localhost:5173`, with the API at `http://localhost:3000`.

## Demo Users

- `alice@lovie.com`
- `bob@lovie.com`
- `charlie@lovie.com`
- `denise@lovie.com`

All users are seeded automatically by `npm run db:seed`.

## Test Commands

Backend verification:

```powershell
npm test
```

Automated E2E flow with video artifact:

```powershell
npm run e2e
```

Generated artifacts:

- `tests/e2e/artifacts/lovie-e2e-recording.webm`
- `tests/e2e/artifacts/summary.json`
- `tests/e2e/artifacts/screenshots/`

Root TypeScript build:

```powershell
npm run build
```

Frontend lint and build:

```powershell
Set-Location frontend
npm run lint
npm run build
```

## Deployment Notes

### Backend

- A container-ready backend image is defined in [Dockerfile.api](./Dockerfile.api).
- A Render blueprint for the API is included in [render.yaml](./render.yaml).
- Production environment variables are documented in [.env.example](./.env.example).
- On boot, the API now applies `schema.sql` automatically and seeds demo data only when the
  database is empty.

### Frontend

- A Vercel SPA config is included in [frontend/vercel.json](./frontend/vercel.json).
- Frontend environment variables are documented in
  [frontend/.env.example](./frontend/.env.example).
- Set `VITE_API_URL` to your deployed backend URL plus `/api/v1`.

## Fast Deploy Checklist

### 1. Deploy PostgreSQL and API on Render

1. Create a managed PostgreSQL instance in Render.
2. Create a new Web Service from this repository and point it to the repo root.
3. Use the existing `render.yaml` or select `Dockerfile.api` as the runtime source.
4. Set these environment variables:
   - `DATABASE_URL=<Render Postgres internal or external URL>`
   - `DATABASE_SSL=true`
   - `CORS_ORIGIN=<your frontend url>`
   - `APP_BASE_URL=<your frontend url>`
5. Deploy once and verify:
   - `GET /health`
   - `GET /api/v1/auth/login` is not needed; use the app UI

### 2. Deploy Frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set the Root Directory to `frontend`.
3. Set:
   - `VITE_API_URL=https://<your-render-api-domain>/api/v1`
4. Deploy and verify login with `alice@lovie.com`.

### 3. Final URLs

- Frontend URL is `https://lovie-p2p-payment-beige.vercel.app`
- Backend health URL is `https://lovie-p2p-payment-api.onrender.com/health`

## Spec-Kit Usage

This repository was initialized locally with the official GitHub Spec-Kit CLI from the
`github/spec-kit` source and is configured for Codex integration.

Local initialization command used:

```powershell
specify init --here --force --integration codex --script ps --offline
```

The resulting Spec-Kit infrastructure now exists in:

- `.specify/`
- `.specify/workflows/speckit/workflow.yml`
- `.specify/scripts/powershell/`
- `.agents/skills/speckit-*`
- `.specify/init-options.json`

## Spec-Kit Artifacts

- Constitution: [`.specify/memory/constitution.md`](./.specify/memory/constitution.md)
- Feature spec: [`specs/001-p2p-payment-request/spec.md`](./specs/001-p2p-payment-request/spec.md)
- Plan: [`specs/001-p2p-payment-request/plan.md`](./specs/001-p2p-payment-request/plan.md)
- Tasks: [`specs/001-p2p-payment-request/tasks.md`](./specs/001-p2p-payment-request/tasks.md)
- Research: [`specs/001-p2p-payment-request/research.md`](./specs/001-p2p-payment-request/research.md)
- Data model: [`specs/001-p2p-payment-request/data-model.md`](./specs/001-p2p-payment-request/data-model.md)
- Quickstart: [`specs/001-p2p-payment-request/quickstart.md`](./specs/001-p2p-payment-request/quickstart.md)
- OpenAPI contract:
  [`specs/001-p2p-payment-request/contracts/openapi.yaml`](./specs/001-p2p-payment-request/contracts/openapi.yaml)

## AI Workflow

The process write-up for the assignment, including spec-first iteration, agent usage, and
verification strategy, is in [AI_WORKFLOW.md](./AI_WORKFLOW.md).

## How It Was Built

This project was delivered with an AI-assisted, spec-driven workflow rather than a single
monolithic prompt. The repo was first aligned to the assignment requirements, then implemented and
verified in small checkpoints so each layer was working before moving on to the next one.

### AI Tools Used

- Codex CLI as the primary agentic coding environment
- Official GitHub Spec-Kit / Specify CLI for local Spec-Kit initialization and workflow assets
- GitHub for public source delivery
- Render and Vercel for live deployment

### Prompt Themes

The work was guided by short task-level prompts such as:

- Audit the existing brownfield repo against the Lovie assignment
- Convert the repo into a Spec-Kit-aligned delivery package
- Repair backend contract, validation, and payment lifecycle correctness
- Build the request dashboard, detail flows, and expiration behavior on the frontend
- Rewrite tests and E2E automation around the real API contract
- Align docs, deployment config, and submission artifacts with the final implementation

### Working Style

- Start from `spec.md`, then `plan.md`, then `tasks.md`
- Validate each small unit before moving to the next larger milestone
- Treat AI output as draft implementation, not final truth
- Fix hallucinated or broken code paths before expanding scope
- Keep docs, contract files, and runtime behavior in sync
