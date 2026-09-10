const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const register = asyncHandler(async (req, res) => {
  const { orgName, orgSegment, name, email, password } = req.body;

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'E-mail já cadastrado');
  }

  const orgResult = await db.query(
    `INSERT INTO organizations (name, segment) VALUES ($1, $2) RETURNING id, name, segment`,
    [orgName, orgSegment || 'propriedade_precisao']
  );
  const org = orgResult.rows[0];

  const passwordHash = await bcrypt.hash(password, 10);
  const userResult = await db.query(
    `INSERT INTO users (org_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     RETURNING id, name, email, role, org_id`,
    [org.id, name, email, passwordHash]
  );
  const user = userResult.rows[0];

  const token = signToken(user);
  res.status(201).json({ token, user, organization: org });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) {
    throw new ApiError(401, 'Credenciais inválidas');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new ApiError(401, 'Credenciais inválidas');
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, org_id: user.org_id },
  });
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, org_id: user.org_id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

module.exports = { register, login };
