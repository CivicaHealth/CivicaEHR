# Deploying the Civica Health info site

`infosite/` is a standalone Next.js app, independent from `apps/dashboard`. It has no
database, no auth, and never imports any `@civica/*` package — it only links out to the
real app.

## Domains

- `civicahealth.com` → hosts `infosite/` (this app). Public marketing/info site.
- `app.civicahealth.com` → hosts `apps/dashboard` (unchanged). The real product, behind
  login.

Every "Launch App" button and CTA on the info site links to
`https://app.civicahealth.com/login` (configurable via `NEXT_PUBLIC_APP_URL`, see
`infosite/.env.example`). The info site itself has no login and never collects or stores
PHI. The newsletter form is still placeholder UI (`src/app/newsletter`). The contact form
(`src/app/contact`) sends a real email via the `submitContactAction` server action
(`src/server/actions/contact-actions.ts`) and `src/lib/email.ts` — it does not store
submissions anywhere.

## Contact form email

`src/lib/email.ts` is a standalone nodemailer/SMTP helper, deliberately mirroring
`packages/email`'s `sendEmail` (same `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/
`SMTP_PASS`/`SMTP_FROM` env var names) so the info site can reuse the same SMTP
provider/credentials as `apps/dashboard`, or be configured independently. It is not an
import of `@civica/email` — the info site stays out of the npm workspace and pulls in no
`@civica/*` code.

If `SMTP_HOST` isn't set, submissions are logged to the server console instead of sent
(safe no-op for local dev) — same fallback behavior as the dashboard's email package.

Submissions are sent to `CONTACT_NOTIFY_EMAIL` (defaults to `pagkratis@gmail.com`, see
`infosite/.env.example`).

## Running locally

```bash
cd infosite
npm install
cp .env.example .env.local   # optional, defaults to the production app URL
npm run dev                  # http://localhost:3000
```

## Building for deployment

```bash
cd infosite
npm install
npm run build
npm run start
```

Deploy `infosite/` as its own service (e.g. its own Vercel project, or its own container)
pointed at the `civicahealth.com` domain. It does not need to share infrastructure,
environment variables, or a deploy pipeline with `apps/dashboard` — the only coupling is
the `NEXT_PUBLIC_APP_URL` link target.

## Notes

- No PHI should ever be submitted through the info site's contact or newsletter forms —
  both are explicitly placeholder/coming-soon and say so in the UI.
- The sitemap (`src/app/sitemap.ts`) only lists public marketing routes — it never
  references `app.civicahealth.com` or any dashboard/tool route.
