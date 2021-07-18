const express = require('express');
const router = express.Router();
const investment = require('../investment/controllers/investmentController');
const auth = require('../auth/authController');

router.get('/securities', investment.getSecurities)
router.get('/my-portfolio', auth.customerAuth, investment.getMyPortfolio)
router.get('/portfolios', auth.customerAuth, investment.getMyPortfolio)
router.get('/my-account', auth.customerAuth, investment.getMyCashAccount)
router.get('/cashBalance', auth.customerAuth, investment.getMyCashAccount)
router.get('/portfolioBalance', auth.customerAuth, investment.getMyPortfolioBalance)
router.get('/tradeInStatement', auth.customerAuth, investment.getTradeInStatement)
router.get('/chart-data', investment.getChartData)
router.get('/securities/overview', investment.getSecurityOverview)
router.get('/order-terms', investment.getOrderTerms)
router.get('/securities/gainers', investment.getGainers)
router.get('/securities/loosers', investment.getLoosers)
router.post('/trade-order/validate',auth.customerAuth, investment.validateTradeOrder)
router.post('/trade-order/create',auth.customerAuth, investment.createTradeOrder)
router.post('/my-account/fund', auth.customerAuth, investment.fundCashAccount)
router.post('/cashBalance/fund', auth.customerAuth, investment.fundCashAccount)

module.exports = router;
