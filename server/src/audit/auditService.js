const crypto = require("crypto");
const pool = require("../config/db");

// JSONB object key order database nundi return ayinappudu
// change ayina hash break kakunda stable serialization.
const stableSerialize = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  const keys = Object.keys(value).sort();

  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableSerialize(value[key])}`
    )
    .join(",")}}`;
};

const buildEventHash = ({
  actorUserId,
  documentId,
  action,
  outcome,
  metadata,
  previousHash,
  createdAt,
}) => {
  const payload = stableSerialize({
    actorUserId,
    documentId,
    action,
    outcome,
    metadata: metadata || {},
    previousHash,
    createdAt,
  });

  return crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex");
};

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

    await client.query(
      "SELECT pg_advisory_xact_lock(785421)"
    );

    const previousResult = await client.query(
      `SELECT event_hash
       FROM audit_events
       ORDER BY chain_index DESC
       LIMIT 1`
    );

    const previousHash =
      previousResult.rows.length > 0
        ? previousResult.rows[0].event_hash
        : "GENESIS";

    const createdAt = new Date().toISOString();

    const eventHash = buildEventHash({
      actorUserId,
      documentId,
      action,
      outcome,
      metadata,
      previousHash,
      createdAt,
    });

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

const verifyAuditChain = async () => {
  const result = await pool.query(
    `SELECT
       id,
       chain_index,
       actor_user_id,
       document_id,
       action,
       outcome,
       metadata,
       previous_hash,
       event_hash,
       created_at
     FROM audit_events
     ORDER BY chain_index ASC`
  );

  let previousHash = "GENESIS";

  for (const event of result.rows) {
    const expectedHash = buildEventHash({
      actorUserId: event.actor_user_id,
      documentId: event.document_id,
      action: event.action,
      outcome: event.outcome,
      metadata: event.metadata || {},
      previousHash,
      createdAt: new Date(event.created_at).toISOString(),
    });

    if (
      event.previous_hash !== previousHash ||
      event.event_hash !== expectedHash
    ) {
      return {
        valid: false,
        brokenEventId: event.id,
        chainIndex: event.chain_index,
      };
    }

    previousHash = event.event_hash;
  }

  return {
    valid: true,
    totalEvents: result.rows.length,
  };
};

module.exports = {
  createAuditEvent,
  verifyAuditChain,
};