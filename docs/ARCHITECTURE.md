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

## Phase 4 additions (landlord and agent portal)
- Partner flow: business profile (admin-verified) -> accept the Landlord/Agent Agreement (a consent record
  against a PUBLISHED version) -> create listing (DRAFT) -> upload the required document (landlords: proof of
  ownership; agents: authority to let) -> submit -> admin approves or rejects with a reason.
- An administrator cannot publish a listing unless the owner's business is VERIFIED and the required
  document exists (`approvalBlockers`). "Verified" is shown to the public only when the reviewer records
  what they actually checked; otherwise the listing is published as unverified.
- Editing a live listing sends it back to moderation, hides it and clears verification.
- Every partner action filters by `ownerId`/`property.ownerId` in the query itself. Another partner's records
  simply do not exist for the caller.
- Documents: bytes go through a `FileStorage` interface. Uploads are limited to PDF/JPEG/PNG up to 5 MB and
  identified by file signature, not by browser-reported type. Local-disk storage exists for local/test only;
  other environments refuse uploads until production object storage is configured (Phase 7). Files are served
  only via `/api/documents/[id]` to the owner or a moderator.
- Viewing and application decisions use conditional updates (`status = REQUESTED/SUBMITTED`), so a request
  can be answered once. An approved application is not a reservation.

## Not yet built (partner side)
Team management and staff permissions, rental and settlement records (settlements are disabled until
approved), email/in-app replies to enquiries, malware scanning of uploads, image galleries for listings.

## Database check constraints (add as a second migration)
Prisma cannot express these, so create an empty migration (`prisma migrate dev --create-only --name ledger_checks`),
paste this SQL into it, then run `prisma migrate dev`:

```sql
ALTER TABLE "LedgerEntry" ADD CONSTRAINT ledger_entry_amount_positive CHECK ("amountKobo" > 0);
ALTER TABLE "Contribution" ADD CONSTRAINT contribution_amount_positive CHECK ("amountKobo" > 0);
```
