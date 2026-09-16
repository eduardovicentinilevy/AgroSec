const express = require('express');
const { listUsers, inviteUser, updateUserRole, removeUser } = require('../controllers/users.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/', listUsers);
router.post(
  '/',
  requireRole('admin'),
  validateBody({
    name: { required: true, type: 'string' },
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
    role: { required: true, type: 'string' },
  }),
  inviteUser
);
router.patch('/:id/role', requireRole('admin'), updateUserRole);
router.delete('/:id', requireRole('admin'), removeUser);

module.exports = router;
