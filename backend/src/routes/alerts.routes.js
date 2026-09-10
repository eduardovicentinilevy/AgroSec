const express = require('express');
const {
  listAlerts,
  getAlert,
  updateAlertStatus,
  containAlert,
  createAlertInternal,
} = require('../controllers/alerts.controller');
const { authenticate, authenticateInternal, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, listAlerts);
router.get('/:id', authenticate, getAlert);
router.patch('/:id/status', authenticate, requireRole('admin', 'analyst'), updateAlertStatus);
router.post('/:id/contain', authenticate, requireRole('admin', 'analyst'), containAlert);

// Callback interno do security-engine para publicar alertas correlacionados.
router.post('/internal', authenticateInternal, createAlertInternal);

module.exports = router;
