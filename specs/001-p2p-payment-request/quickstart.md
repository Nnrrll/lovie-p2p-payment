# Quickstart: Lovie P2P Payment Request

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop or another Docker runtime capable of running PostgreSQL 15
- PowerShell 7 or Windows PowerShell

## 1. Start PostgreSQL

```powershell
docker compose up -d db
```

## 2. Install Dependencies

```powershell
npm install
Set-Location frontend
npm install
Set-Location ..
```

## 3. Apply Schema And Seed Demo Data

```powershell
npm run db:setup
npm run db:seed
```

Seeded users:

- `alice@lovie.com`
- `bob@lovie.com`
- `charlie@lovie.com`
- `denise@lovie.com`

## 4. Start The Backend

```powershell
$env:CORS_ORIGIN = 'http://localhost:5173'
$env:APP_BASE_URL = 'http://localhost:5173'
npm run dev
```

Health check:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/health'
```

## 5. Start The Frontend

```powershell
Set-Location frontend
npm run dev
```

Open `http://localhost:5173`.

## 6. Reviewer UI Walkthrough

### Flow A: Create and pay a request

1. Log in as `alice@lovie.com`
2. Create a request to `bob@lovie.com` for `24.50`
3. Confirm the generated request exposes a shareable link in the detail screen
4. Use outgoing search and status filtering on Alice's dashboard
5. Sign out
6. Log in as `bob@lovie.com`
7. Pay the request from the Incoming queue
8. Open the detail view and confirm the final status is `PAID`

### Flow B: Decline a request

1. Log in as `alice@lovie.com`
2. Create a request to `bob@lovie.com` for any valid amount
3. Sign out
4. Log in as `bob@lovie.com`
5. Decline the request from the Incoming queue
6. Confirm the status becomes `DECLINED`

### Flow C: Cancel a pending outgoing request

1. Log in as `alice@lovie.com`
2. Create a request to `bob@lovie.com` for any valid amount
3. Open the request detail view from the Outgoing queue
4. Use `Cancel`
5. Confirm the status becomes `CANCELLED`

### Flow D: Expired request review

1. Log in as `alice@lovie.com`
2. Open the outgoing or incoming request created by Denise with memo `Expired demo request`
3. Confirm the status is `EXPIRED`
4. Confirm the expiration countdown is no longer active
5. Confirm Pay and Decline actions are not available

## 7. Automated Verification

```powershell
npm test
npm run build
Set-Location frontend
npm run lint
npm run build
```

Full browser E2E with automated recording:

```powershell
Set-Location ..
npm run e2e
```

Expected artifacts:

- `tests/e2e/artifacts/lovie-e2e-recording.webm`
- `tests/e2e/artifacts/summary.json`
- `tests/e2e/artifacts/screenshots/`

## Managed Deployment Note

For hosted environments, the backend automatically applies `schema.sql` on startup and seeds demo
data only if the database is empty. This keeps Render-style deployments reviewer-ready without
requiring a manual SQL bootstrap step.

Public deployment for this repository now runs on:

- Frontend: `https://lovie-p2p-payment-beige.vercel.app`
- Backend health: `https://lovie-p2p-payment-api.onrender.com/health`

Manual smoke verification completed on the public deployment for:

- login
- request creation
- shareable link visibility
- outgoing search and status filtering
- successful pay flow with final `PAID` status
- decline flow
- cancel flow
- expired request review

## 8. Optional API Walkthrough

If the reviewer prefers API-first validation, use the contract examples from
`contracts/openapi.yaml` or the shell commands documented in the README.

## 9. Shutdown

```powershell
docker compose down
```
