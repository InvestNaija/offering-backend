const express = require('express');
const router = express.Router();
const customer = require('../users/controllers/customerController');
const admin = require('../users/controllers/adminController');
const broker = require('../users/controllers/brokerController');
const auth = require('../auth/authController');

router.post('/customers/signup', customer.signup)
router.post('/customers/login', customer.login)
router.post('/customers/verify-otp', customer.verifyCustomer)
router.post('/customers/resend-otp', customer.resendOTP)
router.post('/customers/forgot-password', customer.forgotPasswordCustomer)
router.post('/customers/reset-password/:token', customer.resetPasswordCustomer)
router.post('/customers/change-password', auth.customerAuth, customer.changePassword)

router.post('/admins/signup', admin.signup)
router.post('/admins/login', admin.login)
router.post('/admins/update', auth.adminAuth, admin.update)
router.get('/admins/fetch', auth.adminAuth, admin.fetch)
router.post('/admins/change-password', auth.adminAuth, admin.changePassword)
router.post('/admins/forgot-password', admin.forgotPassword)
router.post('/admins/reset-password/:token', admin.resetPassword)
router.post('/admins/upload-kyc-documents/customer/:id', auth.adminAuth, customer.newUploadKycDocuments)
router.get('/admins/documents/kyc/customer/:id', auth.adminAuth, customer.getUploadedKycDocuments)
router.patch('/admins/next-of-kin/customer/:id', auth.adminAuth, customer.editNextOfKin)

router.post('/brokers/create', auth.adminAuth, broker.create)
router.post('/brokers/login', broker.login)
router.post('/brokers/change-password', auth.brokerAuth, broker.changePassword)
router.post('/brokers/forgot-password', broker.forgotPasswordBroker)
router.post('/brokers/reset-password/:token', broker.resetPassword)

router.post('/create-role', auth.adminAuth, auth.createRole)
router.get('/roles', auth.adminAuth, auth.getRoles)
router.get('/role/:id', auth.adminAuth, auth.getRole);

module.exports = router;