const db = require('../../models/index');
const AppError = require('../../config/appError');
const flutterwave = require('../../config/fluterwave');
const accesspayment = require('../../config/accessgateway');
const Transaction = db.transactions;
const Customer = db.customers;
const Reservation = db.reservations;
const Wallet = db.wallets;
const asset = require('../../asset/controllers/assetController');
const help = require('../../config/helper');
const {sendEmail} = require('../../config/email');
const {Op} = require('sequelize');
const moment = require('moment');
const utils = require('../../config/utils')
require('dotenv').config();

exports.transactionRequest = async (req, res, next) => {
    try {
        let request = ['amount', 'type', 'description', 'userId', 'reference', 'channel', 'source'];
        request.map(item => {
            if (!req.body[item]) return next(new AppError(`${item} is required`, 400));
        })
        let {amount, type, description, userId, reference, channel, source} = req.body;
        if (!Object.values(utils.TYPE).includes(type.toLowerCase())) return next(new AppError('invalid transaction type', 400));
        if (!Object.values(utils.SOURCE).includes(source.toLowerCase())) return next(new AppError('invalid transaction source', 400));
        if (!Object.values(utils.CHANNEL).includes(channel.toLowerCase())) return next(new AppError('invalid transaction channel', 400));
        const user = await Customer.findByPk(userId);
        if (!user) return next(new AppError('invalid user id', 400));
        const tx = await this.createTransaction(description, amount, type, user, null, null, reference, source, channel);
        res.status(200).json({
            status: 'success',
            data: tx
        })
    } catch (error) {
        return next(error);
    }
}

exports.createTransaction = async (description, amount, type, user, brokerId, reservationId, gatewayReference, source, channel) => {
    try {
        let transactionReference = help.generateOTCode(20, true);
        let tx = {
            reference: transactionReference,
            description,
            amount,
            type,
            customerId: user.id,
            gatewayReference,
            source,
            channel
        }

        tx.module = "e-Offerings";
        tx.productType = "dollarfund";

        if (reservationId) tx.reservation = reservationId;
        if (brokerId) tx.brokerId = brokerId;
        const trans = await Transaction.create(tx);
        return trans;
    } catch (error) {
        console.log(error)
        return;
    }
}

exports.initiateChargeCard = async (user, amount, description, reservation, callback_url, brokerId) => {
    try {
        let transactionReference = help.generateOTCode(20, true);
        const initialize = await flutterwave.intitializeTransaction(user, amount, callback_url, transactionReference);
        if (initialize.status !== 'success') return new AppError(initialize.message, initialize.statusCode);
        let tx = {
            reference: transactionReference,
            description,
            amount: amount,
            type: 'debit',
            customerId: user.id,
            brokerId
        }
        if (reservation) tx.reservation = reservation;
        await Transaction.create(tx);
        return initialize;
    } catch (error) {
        console.error(error);
        return error;
    }
}

exports.initiateDollarCardPayment = async (user, amount, description, reservation, redirect_url, brokerId, subaccountId) => {
    try {
        const transactionReference = help.generateOTCode(20, true);
        const initialize = await flutterwave.initializeDollarTransaction(user, amount, redirect_url, transactionReference, subaccountId);

        if (initialize.status !== 'success') {
            return new AppError(initialize.message, initialize.statusCode);
        }

        const transaction = {
            reference: transactionReference,
            description,
            amount,
            type: 'debit',
            customerId: user.id,
            brokerId
        };

        if (reservation) {
            transaction.reservation = reservation;
        }

        await Transaction.create(transaction);
        return initialize;
    } catch (error) {
        console.error(error);
        return error;
    }
}

exports.getBanks = async (req, res, next) => {
    try {
        const response = await flutterwave.listBanks();
        if (response.status !== 'success') return next(new AppError('Error fetching banks', 500));
        let resp = {
            code: 200,
            status: "success",
            message: response.message,
            data: response.data
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.sharePurchaseSuccessCallback = async (req, res, next) => {
    try {
        let resp = {
            code: 200,
            status: "success",
            message: 'Share callback endpoint hit',
        }
        res.redirect(`${process.env.FRONTEND_URL}/user/dashboard/transactions/`);
        res.locals.resp = resp;
        console.log("charge success callback hit...");
        let {tx_ref, transaction_id} = req.query;
        const verified = await flutterwave.verifyTransaction(transaction_id);
        let transactionReference = verified.tx_ref;
        const user = await Customer.findOne({where: {email: verified.customer.email}});
        if (!user) console.log('Error: User not found...');
        const [rows, [transaction]] = await Transaction.update({
            status: 'success',
            gatewayReference: transaction_id
        }, {returning: true, where: {reference: tx_ref}});
        // console.log('transaction obj: ',transaction);

        await Reservation.update({paid: true, status: "paid"}, {where: {id: transaction.dataValues.reservation}});
        console.log('reservation updated')
        // *** notify customer on asset purchase
        let opts = {
            email: user.email,
            subject: 'TRANSACTION NOTIFICATION',
            message: `<p>Dear ${user.firstName},</p>
            <p>Thank you for your payment, your application is now confirmed.</p>
            <p>Kindly find details of the transaction below;</p>
            <table style="width:100%">
                <tr>
                    <th>Account Name</th>
                    <th>Transaction Amount</th>
                    <th>Description</th>
                </tr>
                <tr>
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${verified.amount}</td>
                    <td>${transaction.description}</td>
                </tr>
            </table>
            <p>Your allotment is being processed and would be completed shortly.</p>
            <p>For further enquiries, please send an <a href = "mailto: dollarfund@chapelhilldenham.com">email</a> to dollarfund@chapelhilldenham.com or call <insert phone number>.</p>
            `
        }
        sendEmail(opts).then(r => console.log('payment success email sent')).catch(err => console.log('error sending payment confirmation email', err))
        return next();
    } catch (error) {
        console.error(error);
    }
}

exports.getAll = async (req, res, next) => {
    try {
        const transactions = await Transaction.findAll({
            include: ['customer'], order: [
                ['createdAt', 'DESC']
            ]
        });
        let resp = {
            code: 200,
            status: "success",
            message: 'All transactions fetched',
            data: transactions
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getMyTransactions = async (req, res, next) => {
    try {

        let customerId = req.user.id;
        let transactions = [];
        let {channel, source, start, end, type} = req.query;

        let query = {
            where: {
                customerId,
            },
            order: [
                ['createdAt', 'DESC']
            ]
        }
        if (start && end) {
            if (!moment(start).isValid() || !moment(end).isValid()) return next(new AppError('invalid date format', 400));
            start = new Date(start);
            end = new Date(end);
            query.where.createdAt = {
                [Op.between]: [start, end]
            }
        }

        if (source) query.where.source = source
        if (channel) query.where.channel = channel
        if (type) query.where.type = type

        transactions = await Transaction.findAll(query);
        let resp = {
            code: 200,
            status: "success",
            message: 'Customers transactions fetched',
            data: transactions
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getBrokersTransactions = async (req, res, next) => {
    try {
        let brokerId = req.user.id;
        const transactions = await Transaction.findAll({
            where: {brokerId}, order: [
                ['createdAt', 'DESC']
            ]
        });
        let resp = {
            code: 200,
            status: "success",
            message: 'Broker\'s transactions fetched',
            data: transactions
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getMyWalletBalance = async (req, res, next) => {
    try {
        let customerId;
        let brokerId;
        if (!req.user) return next(new AppError('Please login to access this resource', 401));
        if (req.user.role === 'customer') customerId = req.user.id;
        else if (req.user.role === 'broker') brokerId = req.user.id;
        let wallet;
        if (customerId) wallet = await Wallet.findOne({where: {customerId}});
        else wallet = await Wallet.findOne({where: {brokerId}});
        if (!wallet) return next(new AppError('Wallet not found', 404));
        const balance = wallet.balance;
        let resp = {
            code: 200,
            status: "success",
            message: 'Customers wallet balance fetched',
            balance
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getFiltered = async (req, res, next) => {
    try {
        let {filter} = req.query;
        if (filter !== 'credit' && filter !== 'debit') return next(new AppError('Invalid filter parameter', 400));
        const transactions = await Transaction.findAll({
            where: {type: filter}, order: [
                ['createdAt', 'DESC']
            ]
        });
        let resp = {
            code: 200,
            status: 'successs',
            data: transactions
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getMyFilteredTransactions = async (req, res, next) => {
    try {
        let {id} = req.user;
        console.log(id);
        let {filter, start, end} = req.query;
        if (!filter) return next(new AppError('filter is required', 400));
        if (filter != 'IPO' && filter != 'Investment' && filter != 'Wallet') return next(new AppError('Invalid filter parameter', 400));
        let transactions = [];
        if (filter == 'IPO') transactions = await Transaction.findAll({
            where: {customerId: id, description: 'Shares Purchase'}, order: [
                ['createdAt', 'DESC']
            ]
        });
        else if (filter == 'Investment') transactions = await Transaction.findAll({
            where: {customerId: id, description: 'Investment Cash Account Deposit'}, order: [
                ['createdAt', 'DESC']
            ]
        });
        else transactions = await Transaction.findAll({
                where: {customerId: id, description: 'Wallet Deposit'}, order: [
                    ['createdAt', 'DESC']
                ]
            });
        let resp = {
            code: 200,
            status: 'successs',
            data: transactions
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.tokenizedPayment = async (user, cardDetail, billTo, amount, reservation, brokerId, description) => {
    try {
        // let {cardDetail, billTo, amount, currency} = req.body;
        const tokenresponse = await accesspayment.TokenizeCard(cardDetail, billTo);
        if (!tokenresponse) return;
        let id = tokenresponse.data.id;
        let paymentData = {
            billTo,
            amount,
            id
        }
        const paymentResponse = await accesspayment.TokenizedPayment(paymentData)
        if (!paymentResponse) return;
        let transactionReference = help.generateOTCode(20, true);
        let tx = {
            reference: transactionReference,
            description,
            amount: amount,
            type: 'debit',
            customerId: user.id,
            brokerId,
            gatewayReference: paymentResponse.data.transactionId
        }
        if (reservation) tx.reservation = reservation;
        if (paymentResponse.data.status !== "AUTHORIZED") {
            console.log(paymentResponse.data.status, paymentResponse.data.errorInformation);
            tx.status = 'failed';
            await Transaction.create(tx);
            return;
        }
        let descriptor = {
            companyName: "Chapel Hill Denham",
            websiteLink: "chapel-hill.com.ng",
            phoneNumber: "+2348145467267",
            email: "cloud@chd.com.ng",
            country: "NG",
            city: "lagos",
            address: "lekki"
        }
        const captureResponse = await accesspayment.CapturePayment(amount, paymentResponse.data.id, paymentResponse.data.merchantRef, descriptor, billTo, cardDetail);
        if (!captureResponse) return;
        if (captureResponse.data.status != "SUCCESSFUL") {
            console.log(captureResponse.data.status, captureResponse.data.errorInformation);
            tx.status = 'failed';
            await Transaction.create(tx);
            return;
        }
        tx.status = 'success';
        await Transaction.create(tx);
        if (reservation) {
            await Reservation.update({paid: true, status: "paid"}, {where: {id: reservation}});
            console.log('reservation updated');
            let opts = {
                email: user.email,
                subject: 'TRANSACTION NOTIFICATION',
                message: `<p>Dear ${user.firstName},</p>
                <p>Thank you for your payment, your application is now confirmed.</p>
                <p>Kindly find details of the transaction below;</p>
                <table style="width:100%">
                    <tr>
                        <th>Account Name</th>
                        <th>Transaction Amount</th>
                        <th>Description</th>
                    </tr>
                    <tr>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td>${verified.amount}</td>
                        <td>${transaction.description}</td>
                    </tr>
                </table>
                <p>Your allotment is being processed and would be completed shortly.</p>
                <p>For further enquiries, please send an <a href = "mailto: dollarfund@chapelhilldenham.com">email</a> to dollarfund@chapelhilldenham.com.</p>
                `
            }
            sendEmail(opts).then(r => console.log('payment success email sent')).catch(err => console.log('error sending payment confirmation email', err))
        }

        return 'success';
    } catch (error) {
        console.error(error);
        return error;
    }
}

exports.encrypt = (req, res, next) => {
    try {
        let data = req.body;
        const response = accesspayment.encrypt(data);
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.decrypt = (req, res, next) => {
    try {
        let {data} = req.body;
        const response = accesspayment.decrypt(data);
        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        return next(error);
    }
}

exports.fundWalletVNuban = async(req, res, next) => {
    try {
        let {id} = req.user;
        let {amount} = req.body;
        if (!amount) return next(new AppError('amount is required', 400));
        const user = await Customer.findByPk(id);
        let obj = {
            customerName: user.firstName,
            customerEmail: user.email,
            customerPhone: user.phone,
            accountName: `${user.firstName} ${user.lastName}`,
            paymentCurrency: 'NGN',
            paymentAmount: parseFloat(amount),
            expirationInMin: 50,
            paymentReference: `VNUBAN${help.generateOTCode(9, false)}`,
            auditId: help.generateOTCode(5, false)
        }
        const vnubanResponse = await accesspayment.createVnuban(obj);
        if (!vnubanResponse) return next(new AppError('Error generating VNUBAN', 500));
        let resp = {
            code: 200,
            status: 'success',
            message: 'VNUBAN successfully generated',
            data: vnubanResponse
        }
        res.status(resp.code).json(resp)
        await Customer.update({accessAuditId: vnubanResponse.auditId}, {where: {id}});
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.fundWalletFlutterwave = async(req, res, next) => {
    try {
        let id = req.user.id;
        let {amount} = req.body;
        if(!amount) return next(new AppError('amount is required', 400));
        const user = await Customer.findByPk(id);
        let callback_url = `${process.env.APPLICATION_BASE_URL}/api/v1/transactions/wallet/flutterwave/credit/success`;
        let description = 'Wallet Deposit';
        const chargeResponse = await this.initiateChargeCard(user, amount, description, null, callback_url, null);
        if(chargeResponse.status !== 'success') return next(new AppError('Error initializing transaction', 500));
        let data = {authorization_url: chargeResponse.data.link};
        let resp = {
            code: 200,
            status: 'success',
            message: 'Payment link generated',
            data
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
    } catch (error) {
        return next(error);
    }
}

exports.walletFundingFlutterwaveWebhook = async(req, res, next) => {
    try {
        let resp = {
            code: 200,
            status: "success",
            message: 'Wallet funding callback endpoint hit',
        }
        res.redirect(`${process.env.FRONTEND_URL}/user/dashboard/transactions/`);
        res.locals.resp = resp;
        console.log("charge success callback hit...");
        let {tx_ref, transaction_id} = req.query;
        const verified = await flutterwave.verifyTransaction(transaction_id);
        let transactionReference = verified.tx_ref;
        const user = await Customer.findOne({where: {email: verified.customer.email}});
        if(!user) console.log('Error: User not found...');
        const [rows, [transaction]] = await Transaction.update({status: 'success', gatewayReference: transaction_id}, {returning: true, where: {reference: tx_ref}});
        const wallet = await Wallet.findOne({where: {customerId: user.id}});
        let balance = parseFloat(wallet.balance);
        let newBalance = balance + parseFloat(verified.amount);
        wallet.balance = newBalance;
        await wallet.save();
        // *** notify customer on asset purchase
        let opts = {
            email: user.email,
            subject: 'TRANSACTION NOTIFICATION',
            message: `<p>Dear ${user.firstName},</p>
            <p>Thank you for your payment, your application is now confirmed.</p>
            <p>Kindly find details of the transaction below;</p>
            <table style="width:100%">
                <tr>
                    <th>Account Name</th>
                    <th>Transaction Amount</th>
                    <th>Description</th>
                </tr>
                <tr>
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${verified.amount}</td>
                    <td>${transaction.description}</td>
                </tr>
            </table>
            <p>For further enquiries, please send an <a href = "mailto: dollarfund@chapelhilldenham.com">email</a> to dollarfund@chapelhilldenham.com or call <insert phone number>.</p>
            `
        }
        sendEmail(opts).then(r => console.log('payment success email sent')).catch(err => console.log('error sending payment confirmation email', err));
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.walletFundingVNubanWebhook = async(req, res, next) => {
    try {
        res.send(200);
        let data = req.body.data;
        let body = await accesspayment.decrypt(data);
        console.log(body);
        const txRecorded = await Transaction.findOne({where: {gatewayReference: body.data.paymentReference}})
        if (txRecorded) {
            console.log('duplicate webhook call..');
            return;
        }
        const user = await Customer.findOne({where: {accessAuditId: body.auditId}});
        if (!user) {
            console.log('invalid audit id');
            return;
        }
        const wallet = await Wallet.findOne({where: {customerId: user.id}});
        if (body.status === 'SUCCESSFUL') {
            let balance = parseFloat(wallet.balance);
            let fundedAmount = parseFloat(body.data.paymentAmount);
            let newBalance = balance + fundedAmount;
            let description = 'Wallet Deposit';
            await Wallet.update({balance: newBalance}, {where: {customerId: user.id}});
            await this.createTransaction(description, fundedAmount, 'credit', user, null, null, body.data.paymentReference, utils.SOURCE.WALLET, utils.CHANNEL.ACCESS);
        }
    } catch (error) {
        return next(error);
    }
}
