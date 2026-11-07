const pool = require("../config/db");

const {
  createAuditEvent,
} = require("../audit/auditService");

const grantPermission = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { documentId } = req.params;
    const { userId, permission } = req.body;

    if (!userId || !permission) {
      return res.status(400).json({
        message: "userId and permission are required",
      });
    }

    if (!["READ", "EDIT"].includes(permission)) {
      return res.status(400).json({
        message: "Permission must be READ or EDIT",
      });
    }

    const documentResult = await pool.query(
      `SELECT id, owner_id
       FROM documents
       WHERE id = $1
       AND deleted_at IS NULL`,
      [documentId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const document = documentResult.rows[0];

    if (document.owner_id !== ownerId) {
      await createAuditEvent({
        actorUserId: ownerId,
        documentId,
        action: "PERMISSION_GRANT",
        outcome: "DENIED",
        metadata: {
          targetUserId: userId,
          requestedPermission: permission,
          reason: "NOT_DOCUMENT_OWNER",
        },
      });

      return res.status(403).json({
        message: "Only the document owner can grant access",
      });
    }

    if (userId === ownerId) {
      return res.status(400).json({
        message: "Owner already has full access",
      });
    }

    const userResult = await pool.query(
      `SELECT id, status
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "Target user not found",
      });
    }

    if (userResult.rows[0].status !== "ACTIVE") {
      return res.status(400).json({
        message: "Target user is not active",
      });
    }

    await pool.query(
      `UPDATE document_permissions
       SET revoked_at = NOW()
       WHERE document_id = $1
       AND user_id = $2
       AND revoked_at IS NULL`,
      [documentId, userId]
    );

    const result = await pool.query(
      `INSERT INTO document_permissions
       (document_id, user_id, permission, granted_by)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         document_id,
         user_id,
         permission,
         granted_by,
         granted_at`,
      [documentId, userId, permission, ownerId]
    );

    await createAuditEvent({
      actorUserId: ownerId,
      documentId,
      action: "PERMISSION_GRANTED",
      outcome: "SUCCESS",
      metadata: {
        targetUserId: userId,
        permission,
      },
    });

    return res.status(201).json({
      message: "Permission granted successfully",
      permission: result.rows[0],
    });
  } catch (error) {
    console.error("Grant permission error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const revokePermission = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { documentId, userId } = req.params;

    const documentResult = await pool.query(
      `SELECT id, owner_id
       FROM documents
       WHERE id = $1
       AND deleted_at IS NULL`,
      [documentId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (documentResult.rows[0].owner_id !== ownerId) {
      await createAuditEvent({
        actorUserId: ownerId,
        documentId,
        action: "PERMISSION_REVOKE",
        outcome: "DENIED",
        metadata: {
          targetUserId: userId,
          reason: "NOT_DOCUMENT_OWNER",
        },
      });

      return res.status(403).json({
        message: "Only the document owner can revoke access",
      });
    }

    const result = await pool.query(
      `UPDATE document_permissions
       SET revoked_at = NOW()
       WHERE document_id = $1
       AND user_id = $2
       AND revoked_at IS NULL
       RETURNING id`,
      [documentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Active permission not found",
      });
    }

    await createAuditEvent({
      actorUserId: ownerId,
      documentId,
      action: "PERMISSION_REVOKED",
      outcome: "SUCCESS",
      metadata: {
        targetUserId: userId,
      },
    });

    return res.json({
      message: "Permission revoked successfully",
    });
  } catch (error) {
    console.error("Revoke permission error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  grantPermission,
  revokePermission,
};