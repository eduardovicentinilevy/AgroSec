const bcrypt = require('bcryptjs');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const listUsers = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT id, name, email, role, created_at FROM users WHERE org_id = $1 ORDER BY created_at ASC`,
    [req.user.org_id]
  );
  res.json(result.rows);
});

// Adiciona um novo colaborador diretamente à organização (o MVP não possui
// fluxo de convite por e-mail; um admin define a senha inicial aqui).
const inviteUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const validRoles = ['admin', 'analyst', 'viewer', 'field_operator'];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, `role inválido. Use um de: ${validRoles.join(', ')}`);
  }

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'E-mail já cadastrado');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO users (org_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, created_at`,
    [req.user.org_id, name, email, passwordHash, role]
  );
  res.status(201).json(result.rows[0]);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['admin', 'analyst', 'viewer', 'field_operator'];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, `role inválido. Use um de: ${validRoles.join(', ')}`);
  }

  if (role !== 'admin') {
    const admins = await db.query(
      `SELECT id FROM users WHERE org_id = $1 AND role = 'admin' AND id != $2`,
      [req.user.org_id, req.params.id]
    );
    if (admins.rows.length === 0) {
      throw new ApiError(400, 'A organização precisa manter ao menos um administrador');
    }
  }

  const result = await db.query(
    `UPDATE users SET role = $1 WHERE id = $2 AND org_id = $3
     RETURNING id, name, email, role, created_at`,
    [role, req.params.id, req.user.org_id]
  );
  if (result.rows.length === 0) throw new ApiError(404, 'Usuário não encontrado');
  res.json(result.rows[0]);
});

const removeUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.sub) {
    throw new ApiError(400, 'Você não pode remover a própria conta');
  }

  const target = await db.query('SELECT role FROM users WHERE id = $1 AND org_id = $2', [
    req.params.id,
    req.user.org_id,
  ]);
  if (target.rows.length === 0) throw new ApiError(404, 'Usuário não encontrado');

  if (target.rows[0].role === 'admin') {
    const admins = await db.query(
      `SELECT id FROM users WHERE org_id = $1 AND role = 'admin' AND id != $2`,
      [req.user.org_id, req.params.id]
    );
    if (admins.rows.length === 0) {
      throw new ApiError(400, 'A organização precisa manter ao menos um administrador');
    }
  }

  await db.query('DELETE FROM users WHERE id = $1 AND org_id = $2', [req.params.id, req.user.org_id]);
  res.status(204).send();
});

module.exports = { listUsers, inviteUser, updateUserRole, removeUser };
