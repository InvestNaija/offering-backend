const express = require('express');
const router = express.Router();
const customer = require('../users/controllers/customerController');
const broker = require('../users/controllers/brokerController');
const auth = require('../auth/authController');

router.route('/')
    .post(auth.brokerAuth, customer.signup)
    .get(auth.adminAuth, customer.get)

router.get('/total/count', auth.adminAuth, customer.count)

router.get('/my-customers/list', auth.brokerAuth, customer.getBrokerCustomers)

router.get('/my-customers/count', auth.brokerAuth, customer.brokerCustomersCount)

router.post('/create-cscs', auth.brokerAndCustomerAuth, customer.createCSCSAccount)

router.patch('/update-avatar', auth.customerAuth, customer.editAvatar)

router.patch('/update-profile', auth.customerAuth, customer.edit)

router.post('/upload-documents',auth.customerAuth, customer.uploadKYC)

router.get('/documents/fetch', auth.customerAuth, customer.fetchDocuments)

router.get('/profile/fetch', auth.customerAuth, customer.getProfile)

router.patch('/update-bank-details', auth.customerAuth, customer.updateBankAccount)

router.get('/:id', customer.fetch)

router.route('/upload-kyc-documents')
    .post(auth.customerAuth, customer.newUploadKycDocuments)

router.get('/documents/kyc', auth.customerAuth, customer.getUploadedKycDocuments)

router.route('/next-of-kin')
    .post(auth.customerAuth, customer.createNextOfKin)
    .patch(auth.customerAuth, customer.editNextOfKin)

router.post('/mini-signup', customer.miniSignup)

//router.get('/asset/first-transaction/:id', auth.customerAuth, customer.getFirstTransactionForAsset)

module.exports = router;