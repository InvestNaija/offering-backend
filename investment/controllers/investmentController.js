const zanibal = require('../../config/zanibal');
const AppError = require('../../config/appError');
const db = require('../../models/index');
const User = db.customers;
const Wallet = db.wallets;
const _ = require('underscore');
const moment = require('moment');
const transaction = require('../../finance/controllers/transactionController');
const utils = require('../../config/utils')

exports.getSecurities = async (req, res, next) => {
    try {
        let {page, perPage} = req.query;
        if (!page || !perPage) return next(new AppError('page and perPage required.', 400));
        const response = await zanibal.getActiveSecurities(page, perPage);
        if (!response) return next(new AppError('error getting securities', 500));
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.getMyPortfolio = async (req, res, next) => {
    try {
        let {id} = req.user;
        const user = await User.findByPk(id);
        if (!user) return next(new AppError('invalid user', 404));
        let {zanibalId, zanibalPortfolioId} = user;
        if (!zanibalId) return next(new AppError('zanibal account unavailable', 500));

        zanibalPortfolioId = zanibalPortfolioId ? zanibalPortfolioId : await updateCustomerPortfolio(zanibalId);
        const response = await zanibal.getTradeOrders(zanibalPortfolioId);
        if (!response) return next(new AppError('gateway error', 500))
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.getTradeInStatement = async (req, res, next) => {
    try {
        let {id} = req.user;
        const user = await User.findByPk(id);
        if (!user) return next(new AppError('invalid user', 404));
        let {zanibalId, zanibalPortfolioId} = user;
        if (!zanibalId) return next(new AppError('zanibal account unavailable', 500));

        zanibalPortfolioId = zanibalPortfolioId ? zanibalPortfolioId : await updateCustomerPortfolio(zanibalId);
        const promises = await Promise.all([
            zanibal.getPortfolioBalance(zanibalPortfolioId),
            zanibal.getCashAccount(zanibalId)
        ])

        if (promises) {
            const portfolioBalance = promises[0];
            let cashBalance = promises[1];
            const {result} = cashBalance;
            if (result && result instanceof Array && result.length > 0) {
                cashBalance = result[0];
            } else {
                cashBalance = null
            }
            const pBal = portfolioBalance ? portfolioBalance.amount : 0
            const cBal = cashBalance ? cashBalance.clearedBalance : 0

            const totalTradInBalance = +pBal + +cBal;

            res.status(200).json({
                status: 'success',
                data: {
                    portfolio: portfolioBalance,
                    cash: cashBalance,
                    totalTradInBalance
                }
            })
        } else {
            return next(new AppError('gateway error', 500))
        }
    } catch (error) {
        return next(error);
    }
}

exports.getMyCashAccount = async (req, res, next) => {
    try {
        let {id} = req.user;
        const user = await User.findByPk(id);
        if (!user) return next(new AppError('invalid user', 404));
        let z_id = user.zanibalId;
        if (!z_id) return next(new AppError('zanibal account unavailable', 500));
        let response = await zanibal.getCashAccount(z_id);
        if (!response) return next(new AppError('gateway error', 500))
        const {result} = response;
        if (result && result instanceof Array && result.length > 0) {
            response = result[0];
        } else {
            response = null
        }
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.getMyPortfolioBalance = async (req, res, next) => {
    try {
        let {id} = req.user;
        const user = await User.findByPk(id);
        if (!user) return next(new AppError('invalid user', 404));
        let {zanibalId, zanibalPortfolioId} = user;
        if (!zanibalId) return next(new AppError('zanibal account unavailable', 500));

        zanibalPortfolioId = zanibalPortfolioId ? zanibalPortfolioId : await updateCustomerPortfolio(zanibalId);
        let response = await zanibal.getPortfolioBalance(zanibalPortfolioId);
        if (!response) return next(new AppError('gateway error', 500))

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.getChartData = async (req, res, next) => {
    try {
        let {name, date} = req.query;
        if (!name || !date) return next(new AppError('security name and start date required', 400));
        const response = await zanibal.getChartData(name, date);
        if (!response) return next(new AppError('gateway error', 500));
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.getSecurityOverview = async (req, res, next) => {
    try {
        let {name} = req.query;
        if (!name) return next(new AppError('security name required', 400));
        const response = await zanibal.getSecurityDetails(name);
        if (!response) return next(new AppError('gateway error', 500));
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.getOrderTerms = async (req, res, next) => {
    try {
        const response = await zanibal.getOrderTerms();
        if (!response) return next(new AppError('gateway error', 500));
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.getGainers = async (req, res, next) => {
    try {
        const response = await zanibal.getTopGainers();
        if (!response) return next(new AppError('gateway error', 500));
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.getLoosers = async (req, res, next) => {
    try {
        const response = await zanibal.getTopLoosers();
        if (!response) return next(new AppError('gateway error', 500));
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.validateTradeOrder = async (req, res, next) => {
    try {
        let {id} = req.user;
        const user = await User.findByPk(id);
        if (!user) return next(new AppError('Invalid user', 404));
        let z_id = user.zanibalId;
        let request = ['securityName', 'orderType', 'quantityRequested', 'orderTermName'];
        request.map(item => {
            if (!req.body[item]) return next(new AppError(`${item} is required`, 400));
        })
        let data = _.pick(req.body, request);
        if (!z_id) return next(new AppError('zanibal account unavailable', 500));
        const portfolioResponse = await zanibal.getPortfolio(z_id);
        if (portfolioResponse.result.length < 1) return next(new AppError('gateway error', 500));
        let portfoliodata = portfolioResponse.result[0];
        let tradeObj = {
            portfolioName: portfoliodata.name,
            securityName: data.securityName,
            priceType: 'MARKET',
            orderOrigin: 'WEB',
            orderDate: moment().format('DD/MM/YYYY'),
            orderType: data.orderType,
            quantityRequested: data.quantityRequested,
            orderCurrency: 'NGN',
            orderTermName: data.orderTermName
        }
        const orderResponse = await zanibal.validateTradeOrder(tradeObj);
        if (!orderResponse) return next(new AppError('gateway error', 500));
        if (!orderResponse.success) return next(new AppError(orderResponse.msgCode, 412));
        let resp = {
            code: 200,
            status: 'success',
            data: orderResponse
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.createTradeOrder = async (req, res, next) => {
    try {
        let {id} = req.user;
        const user = await User.findByPk(id);
        if (!user) return next(new AppError('Invalid user', 404));
        let z_id = user.zanibalId;
        let request = ['securityName', 'orderType', 'quantityRequested', 'orderTermName'];
        request.map(item => {
            if (!req.body[item]) return next(new AppError(`${item} is required`, 400));
        })
        let data = _.pick(req.body, request);
        if (!z_id) return next(new AppError('zanibal account unavailable', 500));
        const portfolioResponse = await zanibal.getPortfolio(z_id);
        if (portfolioResponse.result.length < 1) return next(new AppError('gateway error', 500));
        let portfoliodata = portfolioResponse.result[0];
        let tradeObj = {
            portfolioName: portfoliodata.name,
            securityName: data.securityName,
            priceType: 'MARKET',
            orderOrigin: 'WEB',
            orderDate: moment().format('DD/MM/YYYY'),
            orderType: data.orderType,
            quantityRequested: data.quantityRequested,
            orderCurrency: 'NGN',
            orderTermName: data.orderTermName
        }
        const orderResponse = await zanibal.createTradeOrder(tradeObj);
        if (!orderResponse) return next(new AppError('gateway error', 500));
        if (!orderResponse.success) return next(new AppError(orderResponse.msgCode, 412));
        let resp = {
            code: 200,
            status: 'success',
            data: orderResponse
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.fundCashAccount = async (req, res, next) => {
    try {
        let {id} = req.user;
        let {amount} = req.body;
        if (!amount) return next(new AppError('amount is required', 400));
        let wallet = await Wallet.findOne({where: {customerId: id}});
        if (wallet.balance < amount) return next(new AppError('insufficient wallet balance', 403));
        const user = await User.findByPk(id);
        if (!user) return next(new AppError('invalid user', 404));
        let z_id = user.zanibalId;
        if (!z_id) return next(new AppError('zanibal account unavailable', 500));
        let response = await zanibal.getCashAccount(z_id);
        if (!response) return next(new AppError('gateway error', 500))
        const {result} = response;
        if (result && result instanceof Array && result.length > 0) {
            response = result[0];
        } else {
            return next(new AppError('Account not found', 404))
        }
        let account_id = response.id;
        let cashData = {
            amount,
            cashAccountId: account_id,
            currency: "NGN",
            partnerId: "217646444",
            transMethod: "ECHANNEL",
            transType: "RECEIPT"
        }
        const createCashTransResponse = await zanibal.createCashTransaction(cashData);
        if (!createCashTransResponse) return next(new AppError('gateway error', 500));
        let transaction_id = createCashTransResponse.msgCode;
        const finalizeTransaction = await zanibal.postCashTransaction(transaction_id);
        if (!finalizeTransaction) return next(new AppError('gateway error', 500));
        if (!finalizeTransaction.success) return next(new AppError(finalizeTransaction.msgCode, 512));
        let balance = parseFloat(wallet.balance);
        let newBalance = balance - parseFloat(amount);
        wallet.balance = newBalance;
        await wallet.save();
        let description = 'Investment Cash Account Deposit';
        await transaction.createTransaction(description, amount, 'debit', user, null, null, transaction_id, utils.SOURCE.TRADEIN, utils.CHANNEL.WALLET);
        let resp = {
            code: 200,
            status: 'success',
            message: 'Transaction successful'
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

updateCustomerPortfolio = async (customerId) => {
    let portfolioId = null;
    try {
        const response = await zanibal.getPortfolio(customerId);
        if (response) {
            const {result} = response
            if (result && result instanceof Array && result.length > 0) {
                const {id} = result[0]
                portfolioId = id
                await User.update({zanibalPortfolioId: portfolioId}, {where: {zanibalId: customerId}});
            }
        }

    } catch (error) {
        console.log(error)
    }
    return portfolioId
}
