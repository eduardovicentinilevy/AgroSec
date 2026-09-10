const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const listNodes = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT id, name, node_type, latitude, longitude, vlan_segment, status, last_seen_at, created_at
     FROM nodes WHERE org_id = $1 ORDER BY created_at DESC`,
    [req.user.org_id]
  );
  res.json(result.rows);
});

const createNode = asyncHandler(async (req, res) => {
  const { name, nodeType, latitude, longitude, vlanSegment } = req.body;

  const result = await db.query(
    `INSERT INTO nodes (org_id, name, node_type, latitude, longitude, vlan_segment, status, last_seen_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'online', now())
     RETURNING *`,
    [req.user.org_id, name, nodeType, latitude || null, longitude || null, vlanSegment || null]
  );
  res.status(201).json(result.rows[0]);
});

const getNode = asyncHandler(async (req, res) => {
  const result = await db.query('SELECT * FROM nodes WHERE id = $1 AND org_id = $2', [
    req.params.id,
    req.user.org_id,
  ]);
  if (result.rows.length === 0) throw new ApiError(404, 'Nó não encontrado');
  res.json(result.rows[0]);
});

// Isolamento de rede (Zero Trust) — coloca o nó em quarentena de VLAN,
// usado tanto manualmente quanto por ações de contenção automatizadas.
const isolateNode = asyncHandler(async (req, res) => {
  const result = await db.query(
    `UPDATE nodes SET status = 'isolated' WHERE id = $1 AND org_id = $2 RETURNING *`,
    [req.params.id, req.user.org_id]
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Nó não encontrado');
  res.json(result.rows[0]);
});

const restoreNode = asyncHandler(async (req, res) => {
  const result = await db.query(
    `UPDATE nodes SET status = 'online', last_seen_at = now() WHERE id = $1 AND org_id = $2 RETURNING *`,
    [req.params.id, req.user.org_id]
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Nó não encontrado');
  res.json(result.rows[0]);
});

module.exports = { listNodes, createNode, getNode, isolateNode, restoreNode };
