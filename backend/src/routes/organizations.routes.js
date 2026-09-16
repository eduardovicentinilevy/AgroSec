const express = require('express');
const { getMyOrganization, updateMyOrganization } = require('../controllers/organizations.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/mine', getMyOrganization);
router.patch('/mine', requireRole('admin'), updateMyOrganization);

module.exports = router;
