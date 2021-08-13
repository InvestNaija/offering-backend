const express = require('express');
const router = express.Router();
const auth = require('../auth/authController');
const customer = require('../users/controllers/customerController');
const verification = require('../users/controllers/verificationController');
const reservation = require('../asset/controllers/reservationController');
const xmlBuilder = require('../config/xmlBuilder');


router.post('/customers/create', auth.momoAuth, customer.signupViaMTN)
router.post('/customers/verify', auth.mtnAuth, xmlBuilder.verifyRequest , verification.verifyCustomerMTN)
router.post('/customers/payment-request', auth.mtnAuth, xmlBuilder.paymentRequest, reservation.reserveAssetMTN)
// router.get('/customers', auth.mtnAuth, customer.getBrokerCustomers)

// router.post('/customers/verify/bvn', auth.mtnAuth, verification.verifyBVN)

// router.post('/customers/verify/cscs', auth.mtnAuth, verification.verifyCSCS)
// router.post('/customers/create-cscs', auth.mtnAuth, customer.createCSCSAccount)

router.post('/customers/create-new', auth.momoAuth, customer.signupViaMTNWithoutVerifications)
router.post('/customers/first-step', auth.momoAndCustomerAuth, customer.firstStepVerification)

module.exports = router;