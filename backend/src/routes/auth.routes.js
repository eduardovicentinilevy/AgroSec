const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  validateBody({
    orgName: { required: true, type: 'string' },
    name: { required: true, type: 'string' },
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),
  register
);

router.post(
  '/login',
  validateBody({
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),
  login
);

module.exports = router;
