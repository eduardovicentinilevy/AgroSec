const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const getCurrentSubscription = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT * FROM subscriptions WHERE org_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [req.user.org_id]
  );
  res.json(result.rows[0] || null);
});

// Ativa ou substitui o plano vigente da organização. Reflete os três
// formatos de cobrança da pesquisa de modelo de negócio: por hectare
// monitorado, por nó operacional protegido, e o adicional de governança.
const createSubscription = asyncHandler(async (req, res) => {
  const { planType, hectaresMonitored, nodesProtected, monthlyValue } = req.body;
  const validPlans = ['per_hectare', 'per_node', 'compliance_addon'];
  if (!validPlans.includes(planType)) {
    throw new ApiError(400, `planType inválido. Use um de: ${validPlans.join(', ')}`);
  }
  if (monthlyValue === undefined || monthlyValue === null || Number(monthlyValue) < 0) {
    throw new ApiError(400, 'monthlyValue é obrigatório e deve ser >= 0');
  }

  const result = await db.query(
    `INSERT INTO subscriptions (org_id, plan_type, hectares_monitored, nodes_protected, monthly_value)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user.org_id, planType, hectaresMonitored || 0, nodesProtected || 0, monthlyValue]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = { getCurrentSubscription, createSubscription };
