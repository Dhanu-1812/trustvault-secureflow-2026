# TrustVault SecureFlow 2026

Secure document sharing platform with server-enforced access control and audit trails.

## Status

Work in progress.

## Planned Roles

- Administrator
- Document Owner
- Viewer

## Core Security Goals

1. Unauthorized users cannot access documents.
2. Access revocation takes effect immediately.
3. Successful and denied access attempts are audited.

## Planned Tech Stack

- React
- Node.js
- Express
- PostgreSQL

## Current Progress

Initial project setup completed.
## Production Deployment

- Frontend: Render Static Site
- Backend: Render Web Service
- Database: Supabase PostgreSQL
- Document Storage: Private Supabase Storage bucket

The production deployment was verified with the complete security flow:

1. OWNER uploads a document.
2. OWNER grants READ access to a VIEWER.
3. VIEWER can download the authorized document.
4. OWNER revokes access.
5. VIEWER immediately loses document access.
6. ADMIN verifies the tamper-evident audit chain.
7. OWNER can securely delete the document.
## Security Controls

- JWT-based authentication with OWNER, VIEWER, and ADMIN roles.
- Document-level authorization enforced by the backend.
- Immediate access revocation using active permission checks.
- Owner-only document deletion.
- Authorization-aware search prevents metadata leakage.
- Private Supabase Storage for documents.
- Row Level Security enabled on Supabase database tables.
- UUID validation on document and permission routes.
- Login rate limiting and Helmet security headers.
- Restricted CORS configuration.
- Tamper-evident SHA-256 audit hash chain.
- Denied access attempts are recorded in the audit trail.
- Automated security tests cover authorization and revocation scenarios.
## Automated Security Tests

Run the backend security test suite with:

```bash
npm --prefix server test
The test suite verifies important security scenarios including:
- VIEWER cannot delete an OWNER document.
- Revoked users cannot discover documents through search.
- VIEWER cannot grant document access.
- VIEWER cannot revoke another user's permission.
- VIEWER cannot access ADMIN audit verification.
- Invalid document UUIDs are rejected safely.
- Protected authentication routes reject missing tokens.
- Revoked VIEWER access is denied on direct document download.
## Demo Accounts

Use these accounts on the live deployment:

| Role | Email | Password |
|---|---|---|
| OWNER | owner1@example.com | TestPass@123 |
| VIEWER | viewer1@example.com | ViewerPass@123 |
| ADMIN | admin1@example.com | AdminPass@123 |

These accounts are intended only for hackathon evaluation and contain demo data.