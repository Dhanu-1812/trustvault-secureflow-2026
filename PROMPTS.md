# AI Development Log

## 2026-11-06 — Initial project planning

### Prompt
Asked AI to explain how to start the TrustVault project, structure the repository, and follow the hackathon rules.

### AI suggestion
Use a private GitHub repository during development, create documentation files from the beginning, and build the project incrementally with genuine commits.

### What I checked
I compared the guidance with the official hackathon instructions.

### Current status
Initial repository setup is in progress.

### Commit
To be added after the first commit.---

## 2026-11-07 — Document-Level Authorization and Immediate Revocation

### Prompt
Asked AI to help design secure document access so that Owners can share documents with Viewers while unauthorized or revoked users cannot access files directly.

### AI Suggestion
Use a centralized document authorization function that checks:
- Whether the authenticated user owns the document.
- Whether the user currently has an active READ or EDIT permission.
- Whether the permission has been revoked.

### What I Verified
I did not rely only on the UI or document list.

I manually tested direct access to the download endpoint using a Viewer account after the Owner revoked access.

### Result
The Viewer received:

`Document not found`

The Viewer document list also became empty immediately after revocation.

### Security Decision
Authorization is enforced on the backend for the requested document instead of trusting frontend visibility.

Current permissions are checked from the database on every protected document request.

### Remaining Work
Automated tests must still be added so removing an authorization check causes the test suite to fail.

### Commit
Security implementation committed as:
`## 2026-11-07 — Audit Chain Verification Hardening

**Prompt / Goal:**  
Design and verify a tamper-evident audit trail for security-sensitive document actions.

**AI-assisted approach:**  
The first implementation chained audit events using timestamp and ID ordering and hashed serialized event metadata.

**Problem found during manual verification:**  
Audit-chain verification failed even though the application had not intentionally modified the stored events. Ordering and JSON serialization were not deterministic enough for reliable hash reconstruction.

**Correction made:**  
- Added a monotonic `chain_index` to `audit_events`.
- Added a unique constraint for the chain index.
- Ordered chain creation and verification by `chain_index`.
- Added stable serialization with sorted object keys.
- Used a PostgreSQL advisory transaction lock while creating chained audit events.
- Re-ran verification after clearing only local development audit data.

**Verification result:**  
The rebuilt audit chain verified successfully after the correction.

**Lesson:**  
A hash chain is only useful when event ordering and serialization are deterministic. AI-generated security code must be tested rather than assumed correct.security: enforce document-level download authorization`## 2026-11-07 — Authorization-Aware Document Search

**Prompt / Goal:**  
Add document search without leaking document metadata to users who do not currently have access.

**AI-assisted approach:**  
The search query was designed to return only documents owned by the authenticated user or documents with an active, non-revoked permission.

**Security concern considered:**  
Blocking direct download alone is not enough. Search results can still leak document IDs, names, categories, and metadata if authorization filtering is missing.

**Implementation:**  
- Applied authorization filtering inside the server-side SQL query.
- Excluded revoked permissions.
- Kept deleted documents out of search results.
- Tested with an owner and a revoked viewer account.

**Verification result:**  
After permission revocation, the viewer received an empty search result and could no longer discover the protected document.

**Automated test:**  
Added a test confirming that a revoked viewer cannot discover the document through the search endpoint.

**Lesson:**  
Authorization must protect metadata discovery as well as document download.