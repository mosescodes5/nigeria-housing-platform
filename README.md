# Nigeria Digital Housing Platform

Property discovery, structured rent savings and landlord/agent tooling for Nigeria.

**Status: Phase 3 (customer features, sandbox money only).** Real-money features are disabled and stay disabled until legal,
regulatory and partner approvals are recorded (`docs/COMPLIANCE_LAUNCH.md`).

## Stack
Next.js (App Router), React, TypeScript, Tailwind CSS, PostgreSQL + Prisma, Vitest, Playwright.
Modular monolith: `src/modules/{identity,ledger,...}`.

## Local setup
```bash
npm install                      # also runs prisma generate
cp .env.example .env             # Windows PowerShell: Copy-Item .env.example .env
docker compose up -d             # local PostgreSQL (or point DATABASE_URL at any dev database)
npx prisma migrate dev --name init
npx prisma migrate dev --create-only --name ledger_checks   # then add the SQL from docs/ARCHITECTURE.md
npx prisma migrate dev
# set SEED_DEMO_DATA=yes in .env, then:
npm run db:seed
npm run dev
```

Demo logins (local/test only, created by the seed; password `DemoPass-12345`):
`tenant@example.test`, `landlord@example.test`, `admin@example.test`.

## Checks
```bash
npm run format:check && npm run lint && npm run typecheck
npm run db:validate && npm run check:env
npm test               # unit tests
npm run test:integration   # needs a migrated PostgreSQL
npm run build && npm run test:e2e
```

## Rules
- Icons: custom SVG only (`src/components/icons`). Lucide is blocked by ESLint and CI.
- Money is integer kobo (`bigint`), never floats.
- Permissions are enforced server-side (`src/modules/identity/rbac.ts`).

See `CONTRIBUTING.md`, `DEPLOYMENT.md`, `SECURITY.md`.
