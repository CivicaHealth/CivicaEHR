# Civica EHR Dev Repo

Local development is intentionally simple: one Next.js app, one local Postgres database, and seeded demo accounts for every role.

## Quick Start

1. Install Docker Desktop and Node.js 20+.
2. From this folder, run:

```bash
npm run dev:setup
npm run dev
```

Open http://localhost:3000.

Staff self-registration code for the demo clinic: `DEMO-CLINIC`.

## Demo Logins

All seeded accounts use password `CivicaDev123!`.

| Role | Email |
| --- | --- |
| Civica admin | `admin@civica.dev` |
| Clinic admin | `clinic-admin@civica.dev` |
| Doctor | `doctor@civica.dev` |
| Nurse | `nurse@civica.dev` |
| Front desk | `front-desk@civica.dev` |
| Billing | `billing@civica.dev` |
| Inventory manager | `inventory@civica.dev` |
| Auditor | `auditor@civica.dev` |
| Patient | `patient@civica.dev` |

## Useful Commands

```bash
npm run db:up      # start the local database
npm run db:seed    # create/update schema and demo data
npm run db:reset   # wipe local database volume and reseed
npm run dev        # run the dashboard dev server
npm run build      # production build check
```

The app reads local settings from `.env.local`. The checked-in defaults are development-only and safe for local use.
