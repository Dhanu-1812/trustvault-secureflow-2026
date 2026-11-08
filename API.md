# TrustVault SecureFlow 2026 — API Documentation

## Base URLs

```text
Local: http://localhost:5000
Production: https://YOUR_RENDER_BACKEND_URL.onrender.com
```

Protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Roles

- **OWNER** — uploads, shares, revokes, downloads, searches, and deletes owned documents.
- **VIEWER** — accesses only documents explicitly shared with them.
- **ADMIN** — verifies the audit chain.

## Authentication

### POST `/api/auth/register`
Creates an OWNER or VIEWER account.

### POST `/api/auth/login`
Authenticates a user and returns a JWT.

### GET `/api/auth/me`
Returns the authenticated user's information.

---

## Documents

### GET `/api/documents`
Returns documents the authenticated user is authorized to access.

### POST `/api/documents/upload`
Uploads a document to private Supabase Storage.

**Role:** OWNER

Supported file types:
- PDF
- PNG
- JPEG

Maximum file size: **10 MB**

### GET `/api/documents/search?q=<query>`
Searches only documents accessible to the authenticated user.

Unauthorized and revoked documents are excluded from results.

### GET `/api/documents/:documentId/download`
Downloads a document after backend authorization.

Allowed for:
- Document OWNER
- User with active READ or EDIT permission

Revoked users are denied immediately.

### DELETE `/api/documents/:documentId`
Deletes a document.

**Permission:** Only the document OWNER.

---

## Permissions

Authenticated OWNERs can grant or revoke document permissions.

The backend verifies document ownership before permission changes.

Supported permissions:

```text
READ
EDIT
```

Revocation becomes effective immediately because every protected document request checks the current active permission in PostgreSQL.

---

## User Lookup

### GET `/api/users/lookup?email=<email>`

Finds an active user by email for document sharing.

Authentication is required.

---

## Audit Verification

### GET `/api/audit/verify`

Verifies the SHA-256 tamper-evident audit hash chain.

**Role:** ADMIN only.

The audit trail records important security events including:

- Permission grants
- Permission revocations
- Successful document downloads
- Denied access attempts
- Document deletion

---

## Security Controls

- Backend-enforced document authorization
- Immediate access revocation
- Private Supabase Storage
- Supabase PostgreSQL with Row Level Security
- JWT authentication
- bcrypt password hashing
- Helmet security headers
- Login rate limiting
- Restricted CORS
- UUID validation
- Unique active permission constraint
- Authorization-aware search
- SHA-256 tamper-evident audit chain
- Automated authorization and revocation security tests

## Health Endpoints

### GET `/health`
Checks whether the backend service is running.

### GET `/db-health`
Checks whether the backend can connect to PostgreSQL.