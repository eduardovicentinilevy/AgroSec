const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, 'Token de autenticação ausente'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    next(new ApiError(401, 'Token inválido ou expirado'));
  }
}

// Autentica chamadas internas (ex.: security-engine em Python) via token
// compartilhado, simulando a confiança implícita de um consumidor autorizado
// do barramento Pub/Sub em produção.
function authenticateInternal(req, res, next) {
  const header = req.headers['x-internal-token'];
  if (!header || header !== process.env.INTERNAL_SERVICE_TOKEN) {
    return next(new ApiError(401, 'Token interno inválido'));
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Permissão insuficiente para esta ação'));
    }
    next();
  };
}

module.exports = { authenticate, authenticateInternal, requireRole };
