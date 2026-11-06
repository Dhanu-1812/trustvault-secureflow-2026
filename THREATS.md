# TrustVault Threat Model

This document will be updated as the project is developed.

## T01 — Unauthorized Document Access / IDOR

### Attack
An authenticated user changes a document ID and attempts to access another user's document.

### Required Defence
The backend must verify the current user's permission for the requested document on every sensitive request.

### Verification
Automated negative authorization tests.

### Status
Planned.

---

## T02 — Access After Revocation

### Attack
A user receives document access, then continues trying to access the document after the owner revokes permission.

### Required Defence
The backend must check the current permission state every time the document is accessed.

### Verification
Grant access → verify access → revoke access → verify immediate denial.

### Status
Planned.