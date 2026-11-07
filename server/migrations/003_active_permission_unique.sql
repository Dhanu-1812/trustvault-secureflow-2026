CREATE UNIQUE INDEX IF NOT EXISTS uq_active_document_permission
ON document_permissions (document_id, user_id)
WHERE revoked_at IS NULL;