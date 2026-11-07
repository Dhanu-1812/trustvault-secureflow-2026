const pool = require("../config/db");

const authorizeDocument = async (userId, documentId, requiredPermission = "READ") => {
  const result = await pool.query(
    `
    SELECT
      d.id,
      d.owner_id,
      d.name,
      d.storage_key,
      d.mime_type,
      d.size_bytes,
      d.category,
      p.permission
    FROM documents d
    LEFT JOIN document_permissions p
      ON p.document_id = d.id
      AND p.user_id = $1
      AND p.revoked_at IS NULL
    WHERE d.id = $2
      AND d.deleted_at IS NULL
    LIMIT 1
    `,
    [userId, documentId]
  );

  if (result.rows.length === 0) {
    return {
      allowed: false,
      document: null,
    };
  }

  const document = result.rows[0];

  if (document.owner_id === userId) {
    return {
      allowed: true,
      document,
    };
  }

  if (requiredPermission === "READ") {
    const allowed =
      document.permission === "READ" ||
      document.permission === "EDIT";

    return {
      allowed,
      document: allowed ? document : null,
    };
  }

  if (requiredPermission === "EDIT") {
    const allowed = document.permission === "EDIT";

    return {
      allowed,
      document: allowed ? document : null,
    };
  }

  return {
    allowed: false,
    document: null,
  };
};

module.exports = {
  authorizeDocument,
};