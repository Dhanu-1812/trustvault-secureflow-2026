# TrustVault Threat Model

This document is updated as security controls are implemented and tested.

## T01 — Unauthorized Document Access / IDOR

### Attack
An authenticated user changes a document ID and attempts to access another user's document directly.

### Defence
Every sensitive document request is checked through centralized server-side document authorization.

Users are allowed only when:
- They own the document, or
- They currently hold the required active permission.

Unauthorized requests do not receive document metadata or file content.

### Verification
Tested direct document download using a Viewer account without an active permission.

Expected result:
- Request denied
- Response: `Document not found`

### Status
Implemented and manually verified.

---

## T02 — Access After Revocation

### Attack
A Viewer is granted access to a document and attempts to continue accessing it after the Owner revokes permission.

### Defence
Permissions are checked against the current database state on every document request.

Revoked permissions have `revoked_at` set and are excluded from authorization queries.

### Verification
1. Owner granted READ permission to Viewer.
2. Viewer could see the shared document.
3. Owner revoked permission.
4. Viewer document list became empty immediately.
5. Viewer attempted direct download using the document ID.
6. Download was denied.

### Status
Implemented and manually verified.

---

## T03 — Unauthorized Permission Grant

### Attack
A non-owner attempts to grant another user access to a document.

### Defence
The permission controller verifies that the authenticated user is the actual document owner before creating a grant.

### Status
Implemented. Automated security test still required.

---

## T04 — Unauthorized Permission Revocation

### Attack
A non-owner attempts to revoke another user's document permission.

### Defence
The permission controller verifies document ownership before revoking access.

### Status
Implemented. Automated security test still required.

---

## T05 — Public File Storage Exposure
Mitigation: Documents are stored in a private Supabase Storage bucket. Direct public access is disabled. Downloads are served only through the authenticated backend after document-level authorization checks.
Status: Implemented and production-tested.
### Attack
A user attempts to bypass the API and access uploaded files directly.

### Defence
Uploaded files are stored outside the public frontend directory and are served only through authenticated backend routes.

Random UUID-based storage filenames are used instead of original filenames.

### Status
Partially implemented. Production private object storage still required.

---

## T06 — Malicious File Upload

### Attack
An attacker uploads an unsupported or oversized file.

### Current Defence
- PDF, JPEG and PNG MIME types are allowlisted.
- Maximum upload size is 10 MB.
- Random server-side storage names are generated.

### Remaining Work
- Validate file signatures / magic bytes.
- Add malware scanning or quarantine strategy.

### Status
Partially implemented.### T07 — Unauthorized Document Discovery Through Search
**Threat:**  
A user without active permission could discover document metadata through search results.

**Impact:**  
Document names, categories, IDs, or metadata could leak even when direct download is blocked.

**Mitigation:**  
Search queries are filtered server-side so results include only documents owned by the authenticated user or documents with an active permission.

**Verification:**  
Automated test confirms that a viewer with revoked access cannot discover the document through the search endpoint.

**Status:** Implemented and tested.

---

### T08 — Unauthorized Document Deletion
**Threat:**  
A viewer or non-owner could attempt to delete another user's document by changing the document ID in the request.

**Impact:**  
Unauthorized data destruction or denial of access.

**Mitigation:**  
Document deletion is restricted to the document owner. Unauthorized deletion attempts return a generic `Document not found` response to reduce information leakage and are recorded in the audit trail.

**Verification:**  
Manual verification and automated test confirm that a viewer cannot delete an owner's document.

**Status:** Implemented and tested.