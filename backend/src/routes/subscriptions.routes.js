const express = require('express');
const { getCurrentSubscription, createSubscription } = require('../controllers/subscriptions.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/current', getCurrentSubscription);
router.post(
  '/',
  requireRole('admin'),
  validateBody({
    planType: { required: true, type: 'string' },
    monthlyValue: { required: true, type: 'number' },
  }),
  createSubscription
);

module.exports = router;
