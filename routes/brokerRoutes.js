const express = require('express');
const router = express.Router();
const broker = require('../users/controllers/brokerController');
const auth = require('../auth/authController');

router.get('/', auth.adminAuth, broker.getAll)

router.get('/count', auth.adminAuth, broker.getNormalCount)

router.get('/momo-agents/count', auth.adminAuth, broker.getMTNCount)

router.patch('/edit-profile/:id', auth.adminAuth, broker.edit)

router.get('/fetch/:id', auth.adminAuth, broker.fetch)

router.post('/upload-institutions', auth.adminAuth, broker.uploadInstitutions)

router.get('/institutions/:id', auth.adminAuth, broker.fetchInstitution)

router.route('/institutions')
    .post(auth.adminAuth, broker.createInstitution)
    .get(auth.adminAuth, broker.fetchInstitutions)

module.exports = router;