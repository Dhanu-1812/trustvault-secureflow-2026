const crypto = require("crypto");
const pool = require("../config/db");

const createAuditEvent = async ({
  actorUserId = null,
  documentId = null,
  action,
  outcome,
  metadata = {},
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Prevent two audit events from creating the same previous_hash.
    await client.query(
      "SELECT pg_advisory_xact_lock(785421)"
    );

    const previousResult = await client.query(
      `SELECT event_hash
       FROM audit_events
       ORDER BY created_at DESC, id DESC
       LIMIT 1`
    );

    const previousHash =
      previousResult.rows.length > 0
        ? previousResult.rows[0].event_hash
        : "GENESIS";

    const createdAt = new Date().toISOString();

    const eventPayload = JSON.stringify({
      actorUserId,
      documentId,
      action,
      outcome,
      metadata,
      previousHash,
      createdAt,
    });

    const eventHash = crypto
      .createHash("sha256")
      .update(eventPayload)
      .digest("hex");

    const result = await client.query(
      `INSERT INTO audit_events
       (
         actor_user_id,
         document_id,
         action,
         outcome,
         metadata,
         previous_hash,
         event_hash,
         created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        actorUserId,
        documentId,
        action,
        outcome,
        metadata,
        previousHash,
        eventHash,
        createdAt,
      ]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createAuditEvent,
};