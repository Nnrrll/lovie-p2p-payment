# P2P Payment Request Feature Specification

## Implementation Status

As of 2026-04-20, this repository contains a working local implementation of the assignment:

- Fastify and PostgreSQL backend with mock email auth and atomic payment settlement
- React and Vite frontend with login, request creation, incoming and outgoing dashboards, request
  detail view, pay, decline, cancel, and expiry countdown behavior
- Automated backend verification via `npm test`
- Spec-Kit-style active source of truth under `specs/001-p2p-payment-request/`

Treat [`specs/001-p2p-payment-request/spec.md`](./specs/001-p2p-payment-request/spec.md) as the
canonical active feature spec. This file remains as the broader assignment summary.

## Overview

Build a peer-to-peer payment request feature that allows users to request money from friends,
manage incoming and outgoing requests, and simulate payment fulfillment. The implementation uses a
spec-driven workflow and keeps the original repo split between a backend service at the root and a
frontend app in `frontend/`.

## Core Requirements

### 1. Request Creation Flow

- User enters recipient email or phone number, amount, and optional note
- System validates amount, recipient format, memo safety, and self-request rules
- System creates a payment request with a unique ID and shareable link

### 2. Request Management Dashboard

- Outgoing requests show `Pending`, `Paid`, `Declined`, `Expired`, or `Cancelled`
- Incoming requests support `Pay`, `Decline`, and `View details`
- Lists support status filtering and search by counterparty

### 3. Request Detail View

- Shows amount, note, sender and recipient info, timestamps, and expiration countdown
- Incoming detail supports `Pay` and `Decline`
- Outgoing detail supports `Cancel` while pending

### 4. Payment Fulfillment Simulation

- Incoming Pay action shows a simulated processing delay
- Success updates the request to `PAID`
- Sender and recipient balances and dashboards refresh from server state

### 5. Request Expiration

- Requests expire after seven days
- Expired requests cannot be paid or declined
- UI shows remaining time and blocks invalid actions

## Technical Summary

- **Authentication**: Mock email login with bearer token stored in browser session storage
- **Backend**: Node.js, Fastify, TypeScript, PostgreSQL
- **Frontend**: React, React Router, Vite, TypeScript
- **Persistence**: PostgreSQL schema defined in `schema.sql`
- **Testing**: Vitest unit and integration tests
- **Docs**: Spec-Kit-style package in `specs/001-p2p-payment-request/`

## Verification Baseline

- `npm test`
- `npm run build`
- `frontend` `npm run lint`
- `frontend` `npm run build`

## Submission Notes

The remaining submission-specific task outside the repo is deploying the backend and frontend to
public URLs under your own accounts and, if needed, attaching a reviewer-facing demo video or link.
