const pool = require("../config/db");

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Document file is required",
      });
    }

    const {
      originalname,
      filename,
      mimetype,
      size,
    } = req.file;

    const ownerId = req.user.userId;
    const category = req.body.category || null;

    const result = await pool.query(
      `INSERT INTO documents
       (owner_id, name, storage_key, mime_type, size_bytes, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, owner_id, name, mime_type, size_bytes, category, created_at`,
      [
        ownerId,
        originalname,
        filename,
        mimetype,
        size,
        category,
      ]
    );

    return res.status(201).json({
      message: "Document uploaded successfully",
      document: result.rows[0],
    });
  } catch (error) {
    console.error("Document upload error:", error);

    return res.status(500).json({
      message: "Internal server error",
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
module.exports = {
  uploadDocument,
  listDocuments,
};