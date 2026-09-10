const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const listAlerts = asyncHandler(async (req, res) => {
  const { status, severity } = req.query;
  const params = [req.user.org_id];
  let where = 'org_id = $1';

  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  if (severity) {
    params.push(severity);
    where += ` AND severity = $${params.length}`;
  }

  const result = await db.query(
    `SELECT * FROM alerts WHERE ${where} ORDER BY created_at DESC`,
    params
  );
  res.json(result.rows);
});

const getAlert = asyncHandler(async (req, res) => {
  const result = await db.query('SELECT * FROM alerts WHERE id = $1 AND org_id = $2', [
    req.params.id,
    req.user.org_id,
  ]);
  if (result.rows.length === 0) throw new ApiError(404, 'Alerta não encontrado');
  res.json(result.rows[0]);
});

// Triagem manual do analista SOC: muda status, opcionalmente marca como
// falso positivo — reflete o fluxo de trabalho de Tier 1 do currículo.
const updateAlertStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['open', 'triaging', 'contained', 'resolved', 'false_positive'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `status inválido. Use um de: ${validStatuses.join(', ')}`);
  }

  const containedAtClause = status === 'contained' ? ', contained_at = now()' : '';
  const result = await db.query(
    `UPDATE alerts SET status = $1, updated_at = now() ${containedAtClause}
     WHERE id = $2 AND org_id = $3 RETURNING *`,
    [status, req.params.id, req.user.org_id]
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Alerta não encontrado');
  res.json(result.rows[0]);
});

// Ação de contenção automatizada (Zero Trust): isola o nó e registra a ação.
const containAlert = asyncHandler(async (req, res) => {
  const { actionType = 'vlan_isolate' } = req.body;

  const alertResult = await db.query('SELECT * FROM alerts WHERE id = $1 AND org_id = $2', [
    req.params.id,
    req.user.org_id,
  ]);
  const alert = alertResult.rows[0];
  if (!alert) throw new ApiError(404, 'Alerta não encontrado');

  if (alert.node_id) {
    await db.query(`UPDATE nodes SET status = 'isolated' WHERE id = $1`, [alert.node_id]);
  }

  await db.query(
    `INSERT INTO containment_actions (alert_id, action_type, status) VALUES ($1, $2, 'executed')`,
    [alert.id, actionType]
  );

  const updated = await db.query(
    `UPDATE alerts SET status = 'contained', contained_at = now(), updated_at = now()
     WHERE id = $1 RETURNING *`,
    [alert.id]
  );
  res.json(updated.rows[0]);
});

// Callback interno usado pelo security-engine (Python) para publicar um
// alerta correlacionado — equivalente a uma Cloud Function gravando o
// resultado da análise de volta na base de dados central.
const createAlertInternal = asyncHandler(async (req, res) => {
  const {
    orgId,
    nodeId,
    eventId,
    iocId,
    title,
    description,
    severity,
    mttdSeconds,
  } = req.body;

  if (!orgId || !title) {
    throw new ApiError(400, 'orgId e title são obrigatórios');
  }

  const result = await db.query(
    `INSERT INTO alerts (org_id, node_id, event_id, ioc_id, title, description, severity, mttd_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      orgId,
      nodeId || null,
      eventId || null,
      iocId || null,
      title,
      description || null,
      severity || 'medium',
      mttdSeconds || null,
    ]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = { listAlerts, getAlert, updateAlertStatus, containAlert, createAlertInternal };
