const express = require('express');
const { syncBatch } = require('../controllers/sync.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/batch', authenticate, syncBatch);

module.exports = router;
