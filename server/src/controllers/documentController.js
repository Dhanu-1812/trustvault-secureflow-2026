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

module.exports = {
  uploadDocument,
};