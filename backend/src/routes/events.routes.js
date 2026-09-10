const express = require('express');
const {
  ingestEvent,
  listEvents,
  listPendingEventsInternal,
  markProcessedInternal,
} = require('../controllers/events.controller');
const { authenticate, authenticateInternal } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  authenticate,
  validateBody({ eventType: { required: true, type: 'string' } }),
  ingestEvent
);
router.get('/', authenticate, listEvents);

// Rotas internas: consumidas pelo security-engine (Python), simulando um
// assinante do tópico GCP Pub/Sub que processa eventos em lote.
router.get('/internal/pending', authenticateInternal, listPendingEventsInternal);
router.post('/internal/mark-processed', authenticateInternal, markProcessedInternal);

module.exports = router;
