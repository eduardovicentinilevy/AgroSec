const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const REPORT_TYPES = ['auditability', 'rural_credit', 'export_compliance'];

const listReports = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT r.*, u.name AS generated_by_name
     FROM compliance_reports r
     LEFT JOIN users u ON u.id = r.generated_by
     WHERE r.org_id = $1
     ORDER BY r.created_at DESC`,
    [req.user.org_id]
  );
  res.json(result.rows);
});

const getReport = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT r.*, u.name AS generated_by_name
     FROM compliance_reports r
     LEFT JOIN users u ON u.id = r.generated_by
     WHERE r.id = $1 AND r.org_id = $2`,
    [req.params.id, req.user.org_id]
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Relatório não encontrado');
  res.json(result.rows[0]);
});

// Monta o snapshot de métricas operacionais do período — a mesma base de
// dados usada no dashboard, mas consolidada e congelada em um registro
// auditável, para instituições financeiras e auditorias de exportação.
async function computeMetrics(orgId, periodStart, periodEnd) {
  const [nodes, alerts, containment, consents, subjects, dataRequests] = await Promise.all([
    db.query(
      `SELECT status, count(*)::int AS count FROM nodes WHERE org_id = $1 GROUP BY status`,
      [orgId]
    ),
    db.query(
      `SELECT severity, status, count(*)::int AS count, avg(mttd_seconds)::float AS avg_mttd
       FROM alerts
       WHERE org_id = $1 AND created_at::date BETWEEN $2 AND $3
       GROUP BY severity, status`,
      [orgId, periodStart, periodEnd]
    ),
    db.query(
      `SELECT ca.status, count(*)::int AS count
       FROM containment_actions ca
       JOIN alerts a ON a.id = ca.alert_id
       WHERE a.org_id = $1 AND ca.executed_at::date BETWEEN $2 AND $3
       GROUP BY ca.status`,
      [orgId, periodStart, periodEnd]
    ),
    db.query(
      `SELECT count(*) FILTER (WHERE c.granted) ::int AS granted,
              count(*) FILTER (WHERE NOT c.granted)::int AS revoked
       FROM consents c
       JOIN data_subjects ds ON ds.id = c.data_subject_id
       WHERE ds.org_id = $1`,
      [orgId]
    ),
    db.query(`SELECT count(*)::int AS count FROM data_subjects WHERE org_id = $1`, [orgId]),
    db.query(
      `SELECT dr.status, count(*)::int AS count
       FROM data_requests dr
       JOIN data_subjects ds ON ds.id = dr.data_subject_id
       WHERE ds.org_id = $1
       GROUP BY dr.status`,
      [orgId]
    ),
  ]);

  const nodesByStatus = Object.fromEntries(nodes.rows.map((r) => [r.status, r.count]));
  const totalNodes = nodes.rows.reduce((sum, r) => sum + r.count, 0);

  const alertsBySeverity = {};
  let totalAlerts = 0;
  let mttdSum = 0;
  let mttdCount = 0;
  for (const row of alerts.rows) {
    alertsBySeverity[row.severity] = (alertsBySeverity[row.severity] || 0) + row.count;
    totalAlerts += row.count;
    if (row.avg_mttd) {
      mttdSum += row.avg_mttd * row.count;
      mttdCount += row.count;
    }
  }
  const resolvedAlerts = alerts.rows
    .filter((r) => ['resolved', 'contained'].includes(r.status))
    .reduce((sum, r) => sum + r.count, 0);

  const containmentByStatus = Object.fromEntries(containment.rows.map((r) => [r.status, r.count]));
  const dataRequestsByStatus = Object.fromEntries(dataRequests.rows.map((r) => [r.status, r.count]));

  return {
    nodes: { total: totalNodes, byStatus: nodesByStatus },
    alerts: {
      total: totalAlerts,
      bySeverity: alertsBySeverity,
      resolvedOrContained: resolvedAlerts,
      avgMttdSeconds: mttdCount ? Math.round(mttdSum / mttdCount) : null,
    },
    containmentActions: {
      total: containment.rows.reduce((sum, r) => sum + r.count, 0),
      byStatus: containmentByStatus,
    },
    lgpd: {
      dataSubjects: subjects.rows[0]?.count || 0,
      consentsGranted: consents.rows[0]?.granted || 0,
      consentsRevoked: consents.rows[0]?.revoked || 0,
      dataRequestsByStatus,
    },
  };
}

const createReport = asyncHandler(async (req, res) => {
  const { reportType, periodStart, periodEnd } = req.body;
  if (!REPORT_TYPES.includes(reportType)) {
    throw new ApiError(400, `reportType inválido. Use um de: ${REPORT_TYPES.join(', ')}`);
  }
  if (!periodStart || !periodEnd) {
    throw new ApiError(400, 'periodStart e periodEnd são obrigatórios (YYYY-MM-DD)');
  }
  if (new Date(periodStart) > new Date(periodEnd)) {
    throw new ApiError(400, 'periodStart não pode ser depois de periodEnd');
  }

  const metrics = await computeMetrics(req.user.org_id, periodStart, periodEnd);

  const result = await db.query(
    `INSERT INTO compliance_reports (org_id, report_type, period_start, period_end, metrics, generated_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [req.user.org_id, reportType, periodStart, periodEnd, JSON.stringify(metrics), req.user.sub]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = { listReports, getReport, createReport };
