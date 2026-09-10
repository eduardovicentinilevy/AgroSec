const express = require('express');
const { listIocs, createIoc } = require('../controllers/iocs.controller');
const { authenticate, authenticateInternal, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

// O security-engine (Python) consulta a lista de IoCs via token interno;
// analistas humanos gerenciam via sessão autenticada normal.
router.get('/', authenticateInternal, listIocs);
router.get('/mine', authenticate, listIocs);
router.post(
  '/',
  authenticate,
  requireRole('admin', 'analyst'),
  validateBody({
    iocType: { required: true, type: 'string', enum: ['ip', 'hash', 'domain', 'pattern'] },
    value: { required: true, type: 'string' },
  }),
  createIoc
);

module.exports = router;
