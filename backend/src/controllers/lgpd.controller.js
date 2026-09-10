const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// --- Titulares de dados (produtores rurais) ---

const listDataSubjects = asyncHandler(async (req, res) => {
  const result = await db.query('SELECT * FROM data_subjects WHERE org_id = $1 ORDER BY created_at DESC', [
    req.user.org_id,
  ]);
  res.json(result.rows);
});

const createDataSubject = asyncHandler(async (req, res) => {
  const { name, cpf, email, phone } = req.body;
  const result = await db.query(
    `INSERT INTO data_subjects (org_id, name, cpf, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.org_id, name, cpf || null, email || null, phone || null]
  );
  res.status(201).json(result.rows[0]);
});

// --- Consentimentos ---

const grantConsent = asyncHandler(async (req, res) => {
  const { dataSubjectId, purpose, dataCategories } = req.body;

  const subject = await db.query('SELECT id FROM data_subjects WHERE id = $1 AND org_id = $2', [
    dataSubjectId,
    req.user.org_id,
  ]);
  if (subject.rows.length === 0) throw new ApiError(404, 'Titular de dados não encontrado');

  const result = await db.query(
    `INSERT INTO consents (data_subject_id, purpose, data_categories, granted)
     VALUES ($1, $2, $3, true) RETURNING *`,
    [dataSubjectId, purpose, dataCategories || []]
  );
  res.status(201).json(result.rows[0]);
});

const revokeConsent = asyncHandler(async (req, res) => {
  const result = await db.query(
    `UPDATE consents SET granted = false, revoked_at = now()
     WHERE id = $1
     AND data_subject_id IN (SELECT id FROM data_subjects WHERE org_id = $2)
     RETURNING *`,
    [req.params.id, req.user.org_id]
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Consentimento não encontrado');
  res.json(result.rows[0]);
});

const listConsents = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT c.* FROM consents c
     JOIN data_subjects ds ON ds.id = c.data_subject_id
     WHERE ds.org_id = $1
     ORDER BY c.granted_at DESC`,
    [req.user.org_id]
  );
  res.json(result.rows);
});

// --- Solicitações de titulares (exportação / exclusão) ---

const createDataRequest = asyncHandler(async (req, res) => {
  const { dataSubjectId, requestType } = req.body;
  const validTypes = ['export', 'delete', 'access'];
  if (!validTypes.includes(requestType)) {
    throw new ApiError(400, `requestType inválido. Use um de: ${validTypes.join(', ')}`);
  }

  const subject = await db.query('SELECT id FROM data_subjects WHERE id = $1 AND org_id = $2', [
    dataSubjectId,
    req.user.org_id,
  ]);
  if (subject.rows.length === 0) throw new ApiError(404, 'Titular de dados não encontrado');

  const result = await db.query(
    `INSERT INTO data_requests (data_subject_id, request_type) VALUES ($1, $2) RETURNING *`,
    [dataSubjectId, requestType]
  );
  res.status(201).json(result.rows[0]);
});

// Executa a solicitação: para 'export', devolve todos os dados do titular;
// para 'delete', anonimiza os registros pessoais mantendo o histórico
// operacional (requisito de auditabilidade), atendendo o prazo legal da LGPD.
const fulfillDataRequest = asyncHandler(async (req, res) => {
  const requestResult = await db.query(
    `SELECT dr.*, ds.org_id FROM data_requests dr
     JOIN data_subjects ds ON ds.id = dr.data_subject_id
     WHERE dr.id = $1`,
    [req.params.id]
  );
  const request = requestResult.rows[0];
  if (!request || request.org_id !== req.user.org_id) {
    throw new ApiError(404, 'Solicitação não encontrada');
  }

  let payload = null;

  if (request.request_type === 'export' || request.request_type === 'access') {
    const subject = await db.query('SELECT * FROM data_subjects WHERE id = $1', [
      request.data_subject_id,
    ]);
    const consents = await db.query('SELECT * FROM consents WHERE data_subject_id = $1', [
      request.data_subject_id,
    ]);
    payload = { subject: subject.rows[0], consents: consents.rows };
  } else if (request.request_type === 'delete') {
    await db.query(
      `UPDATE data_subjects SET name = 'ANONIMIZADO', cpf = NULL, email = NULL, phone = NULL
       WHERE id = $1`,
      [request.data_subject_id]
    );
  }

  const updated = await db.query(
    `UPDATE data_requests SET status = 'completed', completed_at = now() WHERE id = $1 RETURNING *`,
    [request.id]
  );

  res.json({ request: updated.rows[0], data: payload });
});

// --- Mapeamento de dados (data mapping) ---

const listDataMapping = asyncHandler(async (req, res) => {
  const result = await db.query('SELECT * FROM data_mapping WHERE org_id = $1', [req.user.org_id]);
  res.json(result.rows);
});

const createDataMapping = asyncHandler(async (req, res) => {
  const { dataCategory, systemName, storageLocation, retentionPeriodDays, legalBasis } = req.body;
  const result = await db.query(
    `INSERT INTO data_mapping (org_id, data_category, system_name, storage_location, retention_period_days, legal_basis)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      req.user.org_id,
      dataCategory,
      systemName,
      storageLocation,
      retentionPeriodDays || 365,
      legalBasis || 'consentimento',
    ]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = {
  listDataSubjects,
  createDataSubject,
  grantConsent,
  revokeConsent,
  listConsents,
  createDataRequest,
  fulfillDataRequest,
  listDataMapping,
  createDataMapping,
};
