const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/nodes', require('./nodes.routes'));
router.use('/events', require('./events.routes'));
router.use('/alerts', require('./alerts.routes'));
router.use('/sync', require('./sync.routes'));
router.use('/lgpd', require('./lgpd.routes'));
router.use('/iocs', require('./iocs.routes'));

module.exports = router;
