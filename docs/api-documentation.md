# API Reference — Current Baseline

Base prefix: `/api/v1`  
Authentication: bearer JWT for protected endpoints.

This document describes routes present in the current source tree. FastAPI's generated OpenAPI page at `/docs` is the runtime source of truth.

## System

- `GET /health` — basic application health response.
- `GET /api/v1/status` — API status response.

## Authentication

- `POST /api/v1/auth/login` — authenticate using email and password; returns access token and user summary.
- `GET /api/v1/auth/me` — return the authenticated user's summary.

## Dashboard

- `GET /api/v1/dashboard/summary` — role-aware dashboard summary.

## Interns

- `GET /api/v1/interns` — HR sees all intern profiles, managers see assigned interns, interns see their own profile.
- `POST /api/v1/interns` — HR creates an intern profile for an existing intern user account.
- `GET /api/v1/interns/{intern_id}` — retrieve an authorized intern profile.
- `PATCH /api/v1/interns/{intern_id}` — HR updates an intern profile.

## Users

- `GET /api/v1/users` — HR sees user accounts; managers see assigned intern accounts.
- `POST /api/v1/users` — HR creates intern or manager accounts.
- `PATCH /api/v1/users/{user_id}/deactivate` — HR deactivates an account.

## Workspace records

The generic workspace API supports these `kind` values: `goals`, `leave`, `feedback`, `submissions`, `learning`, `certifications`, `onboarding`, and `evaluations`.

- `GET /api/v1/workspace/{kind}` — list records visible to the authenticated role/user.
- `POST /api/v1/workspace/{kind}` — create a record where the role is permitted.
- `PATCH /api/v1/workspace/{kind}/{record_id}` — update permitted fields after ownership/role checks.
- `PATCH /api/v1/workspace/{kind}/{record_id}/acknowledgement` — intern acknowledgement for supported record kinds.

The generic record API is a baseline, not a complete substitute for dedicated business entities, workflows, notifications, verification, or audit trails.

## Security notes

- Protected endpoints require a valid bearer token.
- Role and resource checks are performed in backend route logic for the covered endpoints.
- This reference does not claim that every conceivable IDOR or privilege-escalation path has been tested.
- Do not expose the development server or use real personal data without additional security review.
