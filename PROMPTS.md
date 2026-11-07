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
`security: enforce document-level download authorization`