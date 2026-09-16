const express = require('express');
const { listReports, getReport, createReport } = require('../controllers/reports.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/', listReports);
router.get('/:id', getReport);
router.post(
  '/',
  requireRole('admin', 'analyst'),
  validateBody({
    reportType: { required: true, type: 'string' },
    periodStart: { required: true, type: 'string' },
    periodEnd: { required: true, type: 'string' },
  }),
  createReport
);

module.exports = router;
