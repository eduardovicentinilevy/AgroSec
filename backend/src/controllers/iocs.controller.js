const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const listIocs = asyncHandler(async (req, res) => {
  const result = await db.query('SELECT * FROM iocs ORDER BY created_at DESC');
  res.json(result.rows);
});

const createIoc = asyncHandler(async (req, res) => {
  const { iocType, value, description, severity, source } = req.body;
  const result = await db.query(
    `INSERT INTO iocs (ioc_type, value, description, severity, source)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (ioc_type, value) DO UPDATE SET description = EXCLUDED.description
     RETURNING *`,
    [iocType, value, description || null, severity || 'medium', source || 'manual']
  );
  res.status(201).json(result.rows[0]);
});

module.exports = { listIocs, createIoc };
