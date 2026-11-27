# Security

Report vulnerabilities privately to the maintainers (add a security contact address here before launch).
Do not open public issues for security problems.

Controls in place at this stage: server-side RBAC, validated environment config, security headers,
CodeQL, dependency review, `npm audit`, secret scanning, Dependabot. Planned: MFA for privileged
accounts, rate limiting, signed webhook verification, audit logging.
