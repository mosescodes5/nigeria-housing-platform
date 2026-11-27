# Architecture notes

- Modular monolith. Modules: identity, properties, savings, ledger, payments, admin, compliance.
- Ledger is append-only and double-entry. `assertBalanced` runs before any write. The first migration
  must add `CHECK ("amountKobo" > 0)` on `LedgerEntry` (edit the generated SQL).
- Frontend never changes confirmed balances; only verified, idempotent webhook handlers do.
- Entities not yet modelled (added in later phases): permissions table, user profiles, enquiries,
  viewings, rental applications, reservations, settlements, refunds, disputes, partner agreements,
  complaints, notifications, property documents and verification records.

## Phase 3 additions

- Properties, favourites, enquiries and viewing requests are database-backed. The public site only reads
  PUBLISHED listings. Sample listings come from `prisma/seed.ts` (`SEED_DEMO_DATA=yes`), never from code.
- Ledger accounts: `PARTNER_CLEARING` (asset) and one `CUSTOMER_SAVINGS:<userId>` liability account per
  customer. A confirmed contribution debits clearing and credits the customer account, in one database
  transaction, with a unique reference (`contribution:<id>`) so it can never post twice.
- A customer's confirmed balance is read only from the ledger. Pending, failed and reversed amounts are
  never part of it. Reversals post an opposite transaction; ledger rows are never edited.
- `/api/webhooks/payments` verifies an HMAC-SHA256 signature over the raw body, then calls the same
  idempotent service the sandbox simulator uses. It returns 503 in production until real-money
  deposits are approved.
- Sandbox deposits exist only when `APP_ENV` is `local` or `test`.
- Integration tests (`npm run test:integration`) need a migrated PostgreSQL and cover duplicate and
  concurrent callbacks, failed and reversed payments, idempotency keys and cross-customer access.
- Per-goal progress sums CONFIRMED contributions; the customer total comes from the ledger. A reconciliation
  job comparing the two is planned for the admin phase.
