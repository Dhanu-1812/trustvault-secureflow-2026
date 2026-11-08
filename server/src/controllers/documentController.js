const path = require("path");
const { randomUUID } = require("crypto");
const pool = require("../config/db");

const {
  authorizeDocument,
} = require("../security/documentAuthorization");
const { createAuditEvent } = require("../audit/auditService");

const {
  uploadToStorage,
  downloadFromStorage,
  deleteFromStorage,
} = require("../services/storageService");

const uploadDocument = async (req, res) => {
  let storageKey = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    const userId = req.user.userId;
    const category = req.body.category?.trim() || null;

    const extension = path
      .extname(req.file.originalname)
      .toLowerCase();

    storageKey = `${userId}/${randomUUID()}${extension}`;

    await uploadToStorage({
      storageKey,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    const result = await pool.query(
      `INSERT INTO documents
       (owner_id, name, storage_key, mime_type, size_bytes, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        req.file.originalname,
        storageKey,
        req.file.mimetype,
        req.file.size,
        category,
      ]
    );

    return res.status(201).json({
      message: "Document uploaded successfully",
      document: result.rows[0],
    });
  } catch (error) {
    if (storageKey) {
      try {
        await deleteFromStorage(storageKey);
      } catch (cleanupError) {
        console.error("Storage cleanup error:", cleanupError);
      }
    }

    console.error("Upload document error message:", error?.message);
console.error("Upload document error name:", error?.name);
console.error("Upload document error status:", error?.statusCode || error?.status);
console.error("Upload document error details:", error);

    return res.status(500).json({
      message: "Document upload failed",
    });
  }
};

const listDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `
      SELECT DISTINCT
        d.id,
        d.owner_id,
        d.name,
        d.mime_type,
        d.size_bytes,
        d.category,
        d.created_at
      FROM documents d
      LEFT JOIN document_permissions p
        ON p.document_id = d.id
        AND p.user_id = $1
        AND p.revoked_at IS NULL
      WHERE
        d.deleted_at IS NULL
        AND (
          d.owner_id = $1
          OR p.user_id = $1
        )
      ORDER BY d.created_at DESC
      `,
      [userId]
    );

    return res.json({
      documents: result.rows,
    });
  } catch (error) {
    console.error("List documents error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    const authorization = await authorizeDocument(
      userId,
      documentId,
      "READ"
    );

    if (!authorization.allowed) {
      await createAuditEvent({
        actorUserId: userId,
        documentId: null,
        action: "DOCUMENT_DOWNLOAD",
        outcome: "DENIED",
        metadata: {
          attemptedDocumentId: documentId,
          reason: "NO_ACTIVE_PERMISSION",
        },
      });

      return res.status(404).json({
        message: "Document not found",
      });
    }

    const document = authorization.document;

    const fileBuffer = await downloadFromStorage(
      document.storage_key
    );

    await createAuditEvent({
      actorUserId: userId,
      documentId: document.id,
      action: "DOCUMENT_DOWNLOAD",
      outcome: "SUCCESS",
      metadata: {
        filename: document.name,
      },
    });

    res.setHeader(
      "Content-Type",
      document.mime_type || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`
    );

    return res.send(fileBuffer);
  } catch (error) {
    console.error("Download document error:", error);

    return res.status(500).json({
      message: "Document download failed",
    });
  }
};
const searchDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const query = req.query.q || "";

    const result = await pool.query(
      `
      SELECT DISTINCT
        d.id,
        d.owner_id,
        d.name,
        d.mime_type,
        d.size_bytes,
        d.category,
        d.created_at
      FROM documents d
      LEFT JOIN document_permissions p
        ON p.document_id = d.id
        AND p.user_id = $1
        AND p.revoked_at IS NULL
      WHERE
        d.deleted_at IS NULL
        AND (
          d.owner_id = $1
          OR p.user_id = $1
        )
        AND (
          d.name ILIKE $2
          OR d.category ILIKE $2
        )
      ORDER BY d.created_at DESC
      `,
      [userId, `%${query}%`]
    );

    return res.json({
      documents: result.rows,
    });
  } catch (error) {
    console.error("Search documents error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    const authorization = await authorizeDocument(
      userId,
      documentId,
      "EDIT"
    );

    if (
      !authorization.allowed ||
      authorization.document.owner_id !== userId
    ) {
      await createAuditEvent({
        actorUserId: userId,
        documentId: null,
        action: "DOCUMENT_DELETE",
        outcome: "DENIED",
        metadata: {
          attemptedDocumentId: documentId,
          reason: "NOT_DOCUMENT_OWNER",
        },
      });

      return res.status(404).json({
        message: "Document not found",
      });
    }

    const document = authorization.document;
await deleteFromStorage(document.storage_key);
    await pool.query(
      `UPDATE documents
       SET deleted_at = NOW()
       WHERE id = $1`,
      [documentId]
    );

    await createAuditEvent({
      actorUserId: userId,
      documentId,
      action: "DOCUMENT_DELETE",
      outcome: "SUCCESS",
      metadata: {},
    });

    return res.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
  searchDocuments,
  deleteDocument,
};