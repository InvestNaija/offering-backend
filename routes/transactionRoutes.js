const express = require('express');
const router = express.Router();
const transaction = require('../finance/controllers/transactionController');
const auth = require('../auth/authController');

router.get('/shares/credit/success', transaction.sharePurchaseSuccessCallback)
router.get('/wallet/flutterwave/credit/success', transaction.walletFundingFlutterwaveWebhook)

router.get('/', auth.adminAuth, transaction.getAll)

router.get('/my-transactions', auth.customerAuth, transaction.getMyTransactions)

router.get('/my-transactions/filtered', auth.customerAuth, transaction.getMyFilteredTransactions)

router.get('/broker', auth.brokerAuth, transaction.getBrokersTransactions)

router.get('/wallet/balance', auth.brokerAndCustomerAuth, transaction.getMyWalletBalance)

router.get('/get-filtered', auth.adminAuth, transaction.getFiltered)

router.get('/list-banks', transaction.getBanks)

router.post('/encrypt', transaction.encrypt)

router.post('/decrypt', transaction.decrypt)

router.post('/fund-wallet', auth.customerAuth, transaction.fundWalletVNuban)

router.post('/fund-wallet/flutterwave', auth.customerAuth,auth.customerAuth, transaction.fundWalletFlutterwave)

router.post('/wallet/credit/success', transaction.walletFundingVNubanWebhook)

router.post('/log-transaction', auth.saveAndPlanAuth, transaction.transactionRequest)

router.route('/:id')
    .patch(auth.adminAuth, transaction.updateTransaction)

router.get('/customer/:id', auth.adminAuth, transaction.getCustomerTransaction)

router.get('/asset/:assetId/transactions/customer/:customerId', auth.adminAuth, transaction.downloadCustomerTransactions)

router.get('/asset/:id', auth.adminAuth, transaction.downloadTransactionsPerAsset);

module.exports = router;