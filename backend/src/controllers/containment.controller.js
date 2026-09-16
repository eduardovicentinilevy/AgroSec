const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// Histórico de contenções Zero Trust — a tabela já existia desde o MVP
// inicial (populada a cada vez que um alerta é contido), mas nunca teve
// uma rota própria para consulta e reversão auditável.
const listContainmentActions = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT ca.*, a.title AS alert_title, a.severity AS alert_severity, n.name AS node_name, n.id AS node_id
     FROM containment_actions ca
     JOIN alerts a ON a.id = ca.alert_id
     LEFT JOIN nodes n ON n.id = a.node_id
     WHERE a.org_id = $1
     ORDER BY ca.executed_at DESC`,
    [req.user.org_id]
  );
  res.json(result.rows);
});

// Reverte uma contenção: restaura o nó a 'online' e marca a ação como
// 'rolled_back', preservando o registro original para auditoria (nunca
// apaga a linha, só muda seu status — igual ao padrão usado nos alertas).
const rollbackContainment = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT ca.*, a.node_id, a.org_id
     FROM containment_actions ca
     JOIN alerts a ON a.id = ca.alert_id
     WHERE ca.id = $1`,
    [req.params.id]
  );
  const action = result.rows[0];
  if (!action || action.org_id !== req.user.org_id) {
    throw new ApiError(404, 'Ação de contenção não encontrada');
  }
  if (action.status === 'rolled_back') {
    throw new ApiError(400, 'Esta ação já foi revertida');
  }

  if (action.node_id) {
    await db.query(`UPDATE nodes SET status = 'online', last_seen_at = now() WHERE id = $1`, [
      action.node_id,
    ]);
  }

  const updated = await db.query(
    `UPDATE containment_actions SET status = 'rolled_back' WHERE id = $1 RETURNING *`,
    [action.id]
  );
  res.json(updated.rows[0]);
});

module.exports = { listContainmentActions, rollbackContainment };
