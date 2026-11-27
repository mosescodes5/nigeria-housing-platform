# Nigeria Digital Housing Platform

Property discovery, structured rent savings and landlord/agent tooling for Nigeria.

**Status: Phase 3 (customer features, sandbox money only).** Real-money features are disabled and stay disabled until legal,
regulatory and partner approvals are recorded (`docs/COMPLIANCE_LAUNCH.md`).

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, PostgreSQL + Prisma, Vitest, Playwright.
Modular monolith: `src/modules/{identity,ledger,...}`.

## Local setup

```bash
npm install            # also runs prisma generate; commit the generated package-lock.json
cp .env.example .env   # fill in values; never commit .env
# start a local PostgreSQL, then:
npx prisma migrate dev --name init
SEED_DEMO_DATA=yes npm run db:seed   # sample listings + sandbox placeholder legal versions (never in production)
npm run dev
```

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
