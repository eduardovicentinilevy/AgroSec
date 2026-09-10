const express = require('express');
const { listNodes, createNode, getNode, isolateNode, restoreNode } = require('../controllers/nodes.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/', listNodes);
router.get('/:id', getNode);
router.post(
  '/',
  requireRole('admin', 'analyst'),
  validateBody({
    name: { required: true, type: 'string' },
    nodeType: {
      required: true,
      type: 'string',
      enum: ['balanca', 'gateway_industrial', 'estacao_meteorologica', 'servidor_erp', 'sensor_iot', 'estacao_trabalho'],
    },
  }),
  createNode
);
router.post('/:id/isolate', requireRole('admin', 'analyst'), isolateNode);
router.post('/:id/restore', requireRole('admin', 'analyst'), restoreNode);

module.exports = router;
