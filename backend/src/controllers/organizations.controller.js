const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const getMyOrganization = asyncHandler(async (req, res) => {
  const result = await db.query('SELECT * FROM organizations WHERE id = $1', [req.user.org_id]);
  if (result.rows.length === 0) throw new ApiError(404, 'Organização não encontrada');
  res.json(result.rows[0]);
});

const updateMyOrganization = asyncHandler(async (req, res) => {
  const { name, cnpj, segment } = req.body;
  const validSegments = ['cooperativa_trading', 'propriedade_precisao', 'agtech_parceira'];
  if (segment && !validSegments.includes(segment)) {
    throw new ApiError(400, `segment inválido. Use um de: ${validSegments.join(', ')}`);
  }

  const result = await db.query(
    `UPDATE organizations
     SET name = COALESCE($1, name), cnpj = COALESCE($2, cnpj), segment = COALESCE($3, segment)
     WHERE id = $4
     RETURNING *`,
    [name || null, cnpj || null, segment || null, req.user.org_id]
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Organização não encontrada');
  res.json(result.rows[0]);
});

module.exports = { getMyOrganization, updateMyOrganization };
