const express = require('express');
const { listContainmentActions, rollbackContainment } = require('../controllers/containment.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', listContainmentActions);
router.post('/:id/rollback', requireRole('admin', 'analyst'), rollbackContainment);

module.exports = router;
