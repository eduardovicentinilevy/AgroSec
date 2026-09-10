const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// Endpoint de sincronização em lote do Offline-First Secure Gateway.
// Implementa o padrão Local-First, Sync-Later: o gateway de campo
// acumula leituras em SQLite enquanto offline e envia um lote compactado
// assim que a conectividade é restabelecida. A idempotência é garantida
// por (node_id, client_batch_id); em caso de reenvio, o lote é apenas
// reconhecido como duplicado sem reprocessar os registros.
const syncBatch = asyncHandler(async (req, res) => {
  const { nodeId, clientBatchId, records } = req.body;

  if (!nodeId || !clientBatchId || !Array.isArray(records)) {
    throw new ApiError(400, 'nodeId, clientBatchId e records são obrigatórios');
  }

  const node = await db.query('SELECT id FROM nodes WHERE id = $1 AND org_id = $2', [
    nodeId,
    req.user.org_id,
  ]);
  if (node.rows.length === 0) throw new ApiError(404, 'Nó não encontrado');

  const existingBatch = await db.query(
    'SELECT id FROM sync_batches WHERE node_id = $1 AND client_batch_id = $2',
    [nodeId, clientBatchId]
  );
  if (existingBatch.rows.length > 0) {
    return res.status(200).json({ status: 'duplicate', batchId: existingBatch.rows[0].id });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const batchResult = await client.query(
      `INSERT INTO sync_batches (node_id, client_batch_id, record_count, status)
       VALUES ($1, $2, $3, 'applied') RETURNING id`,
      [nodeId, clientBatchId, records.length]
    );
    const batchId = batchResult.rows[0].id;

    // Last-Write-Wins simplificado: cada registro do lote é inserido como um
    // evento independente e ordenado por occurred_at, resolvendo divergências
    // de gravações paralelas feitas offline sem exigir CRDTs completos no MVP.
    for (const record of records) {
      await client.query(
        `INSERT INTO events (org_id, node_id, event_type, source_ip, raw_payload, occurred_at, sync_batch_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user.org_id,
          nodeId,
          record.eventType,
          record.sourceIp || null,
          record.rawPayload || {},
          record.occurredAt,
          batchId,
        ]
      );
    }

    await client.query(`UPDATE nodes SET status = 'online', last_seen_at = now() WHERE id = $1`, [
      nodeId,
    ]);

    await client.query('COMMIT');
    res.status(201).json({ status: 'applied', batchId, recordCount: records.length });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { syncBatch };
