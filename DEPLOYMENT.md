# Deployment

## Status
No hosting provider is selected yet. `scripts/deploy.sh` fails intentionally until one is configured,
so a green deploy job always means a real deployment.

## Environments
Local, test (CI), staging (`develop`), production (`main`). Never share credentials between them.
Create GitHub Environments `staging` and `production`; add required reviewers to `production`.

## Choosing a provider (open decision)
Options for Next.js + PostgreSQL: Vercel + managed Postgres, or a container host + managed Postgres.
Consider data residency, latency from Nigeria, cost and backup features. Record the decision here.

## Database migrations
Version-controlled with Prisma. Back up before risky production migrations. Destructive migrations
need explicit review and are never run automatically.

## Rollback
To be documented once a provider is chosen (redeploy previous release + database recovery steps).
