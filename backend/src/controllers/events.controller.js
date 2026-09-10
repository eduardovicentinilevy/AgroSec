const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// Ingestão de um evento único (ex.: SDK embarcado em uma balança ou ERP
// chamando diretamente a API quando está online).
const ingestEvent = asyncHandler(async (req, res) => {
  const { nodeId, eventType, sourceIp, rawPayload, occurredAt } = req.body;

  if (nodeId) {
    const node = await db.query('SELECT id FROM nodes WHERE id = $1 AND org_id = $2', [
      nodeId,
      req.user.org_id,
    ]);
    if (node.rows.length === 0) throw new ApiError(404, 'Nó não encontrado');
    await db.query('UPDATE nodes SET last_seen_at = now() WHERE id = $1', [nodeId]);
  }

  const result = await db.query(
    `INSERT INTO events (org_id, node_id, event_type, source_ip, raw_payload, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      req.user.org_id,
      nodeId || null,
      eventType,
      sourceIp || null,
      rawPayload || {},
      occurredAt || new Date().toISOString(),
    ]
  );
  res.status(201).json(result.rows[0]);
});

const listEvents = asyncHandler(async (req, res) => {
  const { processed, limit = 50 } = req.query;
  const params = [req.user.org_id];
  let where = 'org_id = $1';

  if (processed !== undefined) {
    params.push(processed === 'true');
    where += ` AND processed = $${params.length}`;
  }

  params.push(Number(limit));
  const result = await db.query(
    `SELECT * FROM events WHERE ${where} ORDER BY occurred_at DESC LIMIT $${params.length}`,
    params
  );
  res.json(result.rows);
});

// Consumido pelo security-engine (Python), que simula um assinante do
// tópico Pub/Sub de eventos: puxa lotes de eventos ainda não processados.
const listPendingEventsInternal = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 100;
  const result = await db.query(
    `SELECT * FROM events WHERE processed = false ORDER BY occurred_at ASC LIMIT $1`,
    [limit]
  );
  res.json(result.rows);
});

const markProcessedInternal = asyncHandler(async (req, res) => {
  const { eventIds } = req.body;
  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    throw new ApiError(400, 'eventIds deve ser um array não vazio');
  }
  await db.query('UPDATE events SET processed = true WHERE id = ANY($1::uuid[])', [eventIds]);
  res.json({ updated: eventIds.length });
});

module.exports = { ingestEvent, listEvents, listPendingEventsInternal, markProcessedInternal };
