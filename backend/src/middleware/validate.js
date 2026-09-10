const { ApiError } = require('./errorHandler');

// Validador simples baseado em schema declarativo, sem dependência externa.
// schema: { field: { required: bool, type: 'string'|'number'|'boolean'|'array', enum: [...] } }
function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Campo obrigatório ausente: ${field}`);
        continue;
      }
      if (value === undefined || value === null) continue;

      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`Campo ${field} deve ser um array`);
      } else if (rules.type && rules.type !== 'array' && typeof value !== rules.type) {
        errors.push(`Campo ${field} deve ser do tipo ${rules.type}`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Campo ${field} deve ser um de: ${rules.enum.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(400, errors.join('; ')));
    }
    next();
  };
}

module.exports = { validateBody };
