# Architecture

## Overview

Civica Health's platform foundation is an npm workspaces monorepo. `apps/dashboard` is a
Next.js (App Router, TypeScript) application that provides a central login and dashboard
from which clinic staff and patients launch the rest of the ecosystem's tools (EMR,
Inventory, Roster, Patient Portal, Billing, Admin). Shared logic — auth, permissions, audit
logging, database access, UI components, and types — lives in `packages/*` so it can be
reused by future tool apps. This document covers the v1 foundation: authentication,
authorization, the database architecture, and the tool registry. EMR/Inventory/Roster/Billing
business logic is out of scope and represented only by placeholder pages.

Each clinic tool is intended to eventually become its own `apps/<slug>` app that imports
`@civica/auth`, `@civica/permissions`, `@civica/db`, etc. — for now they remain placeholder
routes inside `apps/dashboard`.

## Database architecture

The platform uses **two kinds of PostgreSQL databases**:

1. **Control database** (`civica_control`) — one database for the whole platform. Holds
   identity, clinic, membership, session, tool registry, and audit data. Schema lives in
   `packages/db/src/control/schema/`.
2. **Tenant databases** — one database per clinic (e.g. `civica_clinic_demo`), holding
   clinic-specific operational data. In v1 this is a single placeholder table
   (`clinic_meta`) that proves the per-tenant migration pipeline. Schema lives in
   `packages/db/src/tenant/schema/`.

A clinic's `db_identifier` (in `clinics`) is combined with `TENANT_DATABASE_URL_TEMPLATE`
(replacing `{db}`) to resolve its tenant connection string, unless
`db_connection_string_override` is set. `packages/db/src/tenant/connection.ts` caches one
small connection pool per clinic.

### Control database tables

- **users** — `email`, `password_hash` (Argon2id), `name`, `is_active`, `is_platform_admin`.
  `is_platform_admin` is a cross-clinic flag, not a per-clinic role.
- **clinics** — `slug`, `name`, `db_identifier`, optional `db_connection_string_override`,
  `is_active`.
- **clinic_codes** — registration codes for self-service signup. The plaintext code is never
  stored: `code_identifier_hash` (sha256 of `CLINIC_CODE_LOOKUP_SALT + code`) allows O(1)
  lookup, and `code_hash` (Argon2id) is verified against the submitted code.
- **roles** — the 9 platform roles (see Authorization below).
- **permissions** / **role_permissions** — scaffolded for future fine-grained permission
  checks; not enforced in v1 (authorization currently uses role names directly).
- **clinic_memberships** — links a user to a clinic with one role and a `status`
  (`pending` / `active` / `disabled`). One row per (user, clinic) in v1. New self-registrations
  are created as `pending` with the `patient` role.
- **sessions** — server-side session records. Only `sha256(token)` is stored
  (`token_hash`), plus `expires_at` and `last_activity_at` for idle-timeout enforcement.
- **tool_registry** — drives the dashboard tool cards: `slug`, `display_name`, `route_type`
  (`internal`/`external`), `internal_path`/`external_url`, `enabled`, `required_roles`,
  `sort_order`.
- **audit_events** — append-only log of security-relevant actions (register/login/logout,
  tool launches, membership/role changes). `metadata` is a JSON blob that is sanitized to
  strip any key containing `password`, `token`, `cookie`, `secret`, or `authorization`, and
  must never contain PHI.

## Authentication

- Passwords are hashed with **Argon2id** (`packages/auth/src/password.ts`), optionally
  combined with a server-side `PASSWORD_PEPPER` before hashing.
- Sessions are **server-side records** in the `sessions` table. The session cookie
  (`civica_session`) holds a random 32-byte token, HMAC-signed with `SESSION_SECRET` for
  tamper detection (`packages/auth/src/cookies.ts`). The database stores only the token's
  sha256 hash.
- Sessions expire after 7 days (`SESSION_DURATION_MS`) or after 2 hours of inactivity
  (`IDLE_TIMEOUT_MS`), whichever comes first (`packages/auth/src/session.ts`).
- Cookies are `httpOnly`, `sameSite=lax`, `secure` in production, and scoped to
  `COOKIE_DOMAIN` if set.
- `apps/dashboard/src/proxy.ts` performs a coarse, cookie-presence-only redirect for
  `/dashboard/*` and `/tools/*`. The **authoritative** check is `getCurrentUser()`
  (`@civica/auth`) in `apps/dashboard/src/app/dashboard/layout.tsx`, which validates the
  session against the database on every request.

## Authorization

Nine roles: `platform_admin`, `clinic_admin`, `doctor`, `nurse`, `front_desk`, `billing`,
`inventory_manager`, `patient`, `auditor`.

`platform_admin` is a boolean user flag, not a clinic membership — it grants access to every
enabled tool across all clinics.

Tool access is **deny-by-default** (`packages/permissions/src/authorize.ts`,
`canAccessTool`):

1. If the tool is disabled, access is denied.
2. If the user is a platform admin, access is granted.
3. Otherwise, the user must have a clinic membership with `status = 'active'` whose role is
   listed in the tool's `required_roles`.

Users with a `pending` or `disabled` membership can log in and see the dashboard (with their
status shown), but cannot launch any clinic tools.

## Tool registry and launch flow

`apps/dashboard/src/lib/tools/registry.ts` reads enabled rows from `tool_registry` (via
`@civica/db/control/schema`) and annotates each with whether the current user can access it
(`getDashboardTools`, using `canAccessTool` from `@civica/permissions`). The dashboard
renders a card per tool; inaccessible tools are shown greyed out.

Clicking an accessible tool submits `launchToolAction`
(`apps/dashboard/src/server/actions/tool-actions.ts`), which calls `resolveToolLaunch`
(`apps/dashboard/src/lib/tools/launch.ts`). This re-checks authorization server-side, writes
`TOOL_LAUNCH_ATTEMPT` / `TOOL_LAUNCH_SUCCESS` / `TOOL_LAUNCH_DENIED` audit events (via
`@civica/audit`), and redirects to the tool's `internal_path` or `external_url`. Internal
tool routes independently re-verify access via `ToolPlaceholderPage` and redirect
unauthorized direct navigation back to `/dashboard`.

## Tool module layout

Each tool lives in its own route group folder under
`apps/dashboard/src/app/(tools)/<slug>/`, mapping to a top-level URL (e.g.
`apps/dashboard/src/app/(tools)/emr/page.tsx` → `/emr`). The `(tools)` segment is a Next.js
route group and does not appear in the URL. This keeps each tool's code self-contained and
easy to develop independently while sharing the same Next.js app and the `@civica/*`
packages (auth, permissions, audit, db, ui, types).

Current tool routes: `/emr`, `/inventory`, `/roster`, `/patient-portal`, `/billing`, `/admin`.
Each corresponds to a `tool_registry` row (`slug`, `internal_path`, `required_roles`) that
drives both the dashboard tool card and the authorization check on the route itself. To add a
new tool: add a `tool_registry` row (seed or migration), create
`apps/dashboard/src/app/(tools)/<slug>/page.tsx`, and build out that folder — the dashboard,
auth, proxy protection, and audit logging require no changes. A tool can later be promoted to
its own `apps/<slug>` app (with `tool_registry.route_type = 'external'`) without changing this
pattern, since it imports the same `@civica/*` packages.

`apps/dashboard/src/proxy.ts` protects every route by default except `/login`, `/register`,
`/api/*`, and static assets, so new tool routes are protected automatically.

## Registration flow

1. User submits name, email, password, and a clinic code.
2. The clinic code is verified (`verifyClinicCode`): looked up by identifier hash, checked for
   `is_active`/`expires_at`, and verified with Argon2 against `code_hash`.
3. A new `users` row is created with a `pending` `clinic_memberships` row in the matched
   clinic, role `patient`.
4. A session is created and the user is redirected to the dashboard, where their `pending`
   status is shown until a clinic admin activates the membership (membership activation is a
   future admin tool, not part of this foundation).

Every step (attempt, clinic-code failure, duplicate email, success) is recorded in
`audit_events`.
