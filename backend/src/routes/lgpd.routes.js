const express = require('express');
const ctrl = require('../controllers/lgpd.controller');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/data-subjects', ctrl.listDataSubjects);
router.post(
  '/data-subjects',
  validateBody({ name: { required: true, type: 'string' } }),
  ctrl.createDataSubject
);

router.get('/consents', ctrl.listConsents);
router.post(
  '/consents',
  validateBody({
    dataSubjectId: { required: true, type: 'string' },
    purpose: { required: true, type: 'string' },
  }),
  ctrl.grantConsent
);
router.post('/consents/:id/revoke', ctrl.revokeConsent);

router.post(
  '/requests',
  validateBody({
    dataSubjectId: { required: true, type: 'string' },
    requestType: { required: true, type: 'string', enum: ['export', 'delete', 'access'] },
  }),
  ctrl.createDataRequest
);
router.post('/requests/:id/fulfill', ctrl.fulfillDataRequest);

router.get('/data-mapping', ctrl.listDataMapping);
router.post(
  '/data-mapping',
  validateBody({
    dataCategory: { required: true, type: 'string' },
    systemName: { required: true, type: 'string' },
    storageLocation: { required: true, type: 'string' },
  }),
  ctrl.createDataMapping
);

module.exports = router;
