# Authentication notes

- Sessions are database-backed. The cookie holds a random token (httpOnly, SameSite=Lax, Secure in
  production); only its SHA-256 hash is stored. Sessions last 7 days; logout deletes the row.
- Passwords use bcrypt (cost 12). Unknown emails still run a dummy comparison to blunt timing attacks.
- Public sign-up allows TENANT, BUYER, LANDLORD, AGENT only. ADMIN/SUPPORT accounts need a seed or
  an admin-approved path (not built yet).
- Every protected page or action calls `requireUser()` / `requireUserWithPermission()` on the server.
  `src/middleware.ts` only redirects when no cookie exists; it is not a security boundary.
- Server Actions get Next.js's built-in origin check against CSRF.
- Consent records are written only against PUBLISHED legal document versions. In production,
  registration refuses to run until the terms and privacy documents are published.

## Known gaps (tracked)
- Email/phone verification and OTP (Phase 7 integrations); new users stay PENDING_VERIFICATION.
- Password reset, MFA for privileged accounts, shared-store rate limiting, failed-login audit logging.
- Admin bootstrap/seed script. Landlord and agent identity and authority-to-let checks (Phase 4).
