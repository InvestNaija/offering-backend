const express = require('express');
const router = express.Router();
const verification = require('../users/controllers/verificationController');
const auth = require('../auth/authController');

router.post('/bvn', verification.verifyBVN)
router.post('/nin', verification.verifyNIN)
router.post('/cscs',auth.brokerAndCustomerAuth, verification.verifyCSCS)
router.post('/bank-account', verification.verifyNUBAN)

module.exports = router;