const db = require('../../models/index');
const AppError = require('../../config/appError');
const Asset = db.assets;
const Reservation = db.reservations;
const Customer = db.customers;
const cloudinary = require('../../config/cloudinary');
const _ = require('underscore');
const sendEmail = require('../../config/email');
const {getPagination, getPagingData} = require("../../config/pagination");
const {Op} = require('sequelize');
const moment = require('moment');
const AssetBankDetails = db.assetsBankDetails;
const Transaction = db.transactions;


exports.create = async (req, res, next) => {
    try {
        let {bankName, accountNumber} = req.body;
        let data = _.pick(req.body, ['name', 'type', 'anticipatedMaxPrice', 'anticipatedMinPrice',
            'sharePrice', 'availableShares', 'openForPurchase', 'closingDate', 'description', 'currency',
            'openingDate', 'maturityDate', 'paymentLabel', 'subaccountId', 'subsequentMinAmount']);

        const currentDate = new Date().toISOString();
        const openingDate = moment(data.openingDate).format();
        //const maturityDate = moment(data.maturityDate).format();
        const closingDate = moment(data.closingDate).format();

        // check if opening date is greater than current date.
        if (openingDate >  closingDate) {
            return next(new AppError('Opening Date should be earlier than Closing Date', 400));
        }

        if (closingDate < currentDate) {
            return next(new AppError('Closing Date should be greater than current date', 400));
        }

        // if subaccount id was passed
        if (req.body.subaccountId) {
            data.subaccountId = req.body.subaccountId;
        } else {
            data.subaccountId = 'null';
        }

        // check if subsequentMinAmount is defined
        if (!data.subsequentMinAmount) {
            data.subsequentMinAmount = 0;
        }

        // check if currency is passed
        if (!data.currency) {
            data.currency = 'NGN';
        }

        data.closingDate = new Date(data.closingDate);

        const asset = await Asset.create(data);



        let resp = {
            code: 201,
            status: 'success',
            message: 'Asset successfully created',
            data: asset
        }
        res.status(resp.code).json(resp);

        if (bankName && accountNumber) {
            const newAssetBankDetails = {
                bankName,
                accountNumber,
                assetId: asset.id
            };

            const assetAccountDetails = await AssetBankDetails.create(newAssetBankDetails);
        }

        // upload payment logo
        let {paymentLogo} = req.body;
        if (paymentLogo) {
            const paymentLogoUploadResult = await cloudinary.uploadImage(paymentLogo);

            if (paymentLogoUploadResult.secure_url) {
                await Asset.update({paymentLogo: paymentLogoUploadResult.secure_url}, {where: {id: asset.id}});
                console.log('asset payment logo created');
            }
        }

        let {image} = req.body;
        res.locals.resp = resp;
        if (image) {
            const response = await cloudinary.uploadImage(image);
            if (response.secure_url) await Asset.update({image: response.secure_url}, {where: {id: asset.id}});
            console.log('asset image created');
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.edit = async (req, res, next) => {
    try {
        let {bankName, accountNumber} = req.body;
        let assetId = req.params.id;
        let editData = _.pick(req.body, ['name', 'type', 'anticipatedMaxPrice', 'anticipatedMinPrice',
            'sharePrice', 'availableShares', 'openForPurchase', 'closingDate', 'description', 'currency',
            'openingDate', 'maturityDate', 'paymentLabel', 'subaccountId', 'subsequentMinAmount']);

        const currentDate = new Date().toISOString();
        const openingDate = moment(editData.openingDate).format();
        // const maturityDate = moment(editData.maturityDate).format();
        const closingDate = moment(editData.closingDate).format();

        // check if opening date is greater than current date.
        if (openingDate >  closingDate) {
            return next(new AppError('Opening Date should be earlier than Closing Date', 400));
        }

        if (closingDate < currentDate) {
            return next(new AppError('Closing Date should be greater than Current date', 400));
        }

        // if subaccount id was passed
        if (req.body.subaccountId) {
            editData.subaccountId = req.body.subaccountId;
        } else {
            editData.subaccountId = 'null';
        }

        // check if subsequentMinAmount is defined
        if (!data.subsequentMinAmount) {
            data.subsequentMinAmount = 0;
        }

        // check if currency is passed
        if (!editData.currency) {
            editData.currency = 'NGN';
        }

        editData.closingDate = new Date(editData.closingDate);
        await Asset.update(editData, {where: {id: assetId}});

        let resp = {
            code: 200,
            status: 'success',
            message: 'Asset successfully updated',
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;

        if (bankName && accountNumber) {
            const newAssetBankDetails = {
                bankName,
                accountNumber,
            };

            await AssetBankDetails.update(newAssetBankDetails, {where: {assetId: assetId}});
        }

        // upload payment logo
        let {paymentLogo} = req.body;
        if (paymentLogo) {
            const paymentLogoUploadResult = await cloudinary.uploadImage(paymentLogo);

            if (paymentLogoUploadResult.secure_url) {
                await Asset.update({paymentLogo: paymentLogoUploadResult.secure_url}, {where: {id: assetId}});
                console.log('asset payment logo updated');
            }
        }

        let {image} = req.body;
        if (image) {
            const response = await cloudinary.uploadImage(image);
            // console.log(response.secure_url);
            if (response.secure_url) await Asset.update({image: response.secure_url}, {where: {id: assetId}});
            console.log('asset image updated');
        }

        if (editData.openForPurchase) {
            const pendingReservations = await Reservation.findAll({
                where: {assetId, paid: false},
                include: ['customer', 'asset']
            })
            if (pendingReservations.length > 0) {
                pendingReservations.map(res => {
                    let opts = {
                        email: res.customer.email,
                        subject: 'ISSUE OFFERING',
                        message: `<p>Dear ${user.firstName},</p>
                        <p>The ${res.asset.name} IPO is currently open for subscription.</p>
                        <p>The listing price is ${res.asset.sharePrice} per share.</p>
                        <p>You can make payments for your shares via;</p>
                        <ul>
                            <li>Debit/ Credit card</li>
                            <li>Electronic transfers</li>
                            <li>Direct debit from your account</li>
                            <li>Payment at the bank</li>
                        </ul>
                        <p>Please ensure that you make payment quickly at the bank or fund your account with your bid amount in
                        order to get an allotment of the shares as units will be allocated on a first-come, first-served basis. Hence,
                        funds will leave your account only upon the allocation of shares in this issue.</p>
                        <p>For further enquiries, please send an <a href = "mailto: ${process.env.MAILTO_ADDRESS}">email</a> to ${process.env.MAILTO_ADDRESS} or call ${process.env.PHONENUMBER}.</p>
                        <p><b>This is an automated message, please do not reply directly to the email.</b></p>
                        `
                    }
                    sendEmail(opts).then(r => console.log('asset update email sent')).catch(err => console.log('error sending asset update email'))
                })
            }
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getAll = async (req, res, next) => {
    try {
        let assets = await Asset.findAll();
        let resp = {
            code: 200,
            status: 'success',
            message: 'Assets successfully fetched',
            data: assets
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getOne = async (req, res, next) => {
    try {
        let assetId = req.params.id;
        let customerId = req.user.id;
        let transactions = [];
        if (!assetId) return next(new AppError('assedId required', 400));
        const asset = await Asset.findByPk(assetId);
        if (!asset) return next(new AppError('asset not found', 404));


        // const reservations = await Reservation.findAll({where: {[Op.and]: [{assetId, customerId, status: 'paid'}]}});
        //
        // if (!reservations) {
        //     return next(new AppError('Customer has no transaction', 400));
        // }
        //
        // for (let reservation of reservations) {
        //     let transaction = await Transaction.find({
        //         where: {
        //             [Op.and]:
        //                 {
        //                     reservation: reservation.id,
        //                     customerId,
        //                     status: 'success'
        //                 }
        //         }
        //     });
        //
        //     transactions.push(...transaction);
        // }
        //
        // transactions.sort(function(a,b){
        //     // Turn your strings into dates, and then subtract them
        //     // to get a value that is either negative, positive, or zero.
        //     return new Date(b.date) - new Date(a.date);
        // });

        let resp = {
            code: 200,
            status: 'success',
            message: 'Asset successfully fetched',
            data: asset
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {

    }
}

exports.getOpen = async (req, res, next) => {
    try {
        let asset = await Asset.findAll({where: {openForPurchase: true}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'Assets successfully fetched',
            data: asset
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getPopular = async (req, res, next) => {
    try {
        const assets = await Asset.findAll({
            order: [
                ['popularity', 'DESC']
            ]
        })
        let resp = {
            code: 200,
            status: 'success',
            message: 'Assets successfully fetched',
            data: assets
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getTop = async (req, res, next) => {
    try {
        const assets = await Asset.findAll({
            order: [
                ['sharePrice', 'DESC']
            ]
        })
        let resp = {
            code: 200,
            status: 'success',
            message: 'Assets successfully fetched',
            data: assets
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.delete = async (req, res, next) => {
    try {
        const assetId = req.params.id;
        const asset = await Asset.destroy({where: {id: assetId}});

        let resp = {
            code: 204,
            status: 'success',
            message: 'Asset deleted successfully',
        }

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (err) {
        console.error('Delete Assets Error: ', err);
        return next(err);
    }
}

exports.get = async (req, res, next) => {
    try {
        let {page, size, name, open, popular} = req.query;
        let assetId = req.params.id;
        let assets = [];
        let asset = {};

        // check if we are retrieving only one asset
        if (!assetId) return next(new AppError('Asset Id required', 400));

        asset = await Asset.findByPk(assetId);
        if (!asset) return next(new AppError('asset not found', 404));

        let resp = {
            code: 200,
            status: 'success',
            message: 'Asset successfully fetched',
            data: asset
        }

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();


        // retrieve multiple assets implementation
        if (page && page >= 0) {
            page = page -1;
        } else {
            page = 0;
        }

        const {limit, offset} = getPagination(page, size);

        let query = {
            limit,
            offset,
            distinct: true,
        };

        // get non-deleted items
        query.where.deletedAt = null;

        if (name) {
            let item = {
                [Op.or]: [
                    {name: {[Op.like]: `%${name}%`}}
                ]
            }

            query.where = item;
        }
        if (open) query.where.openForPurchase = true
        if (popular) {
            query.order = [
                ['popularity', 'DESC']
            ]
        }

        query.order = [
            ['createdAt', 'DESC']
        ];

        assets = await Asset.findAndCountAll(query);

        let {data, totalItems, totalPages, currentPage} = getPagingData(assets, page, limit);

        resp = {
            code: 200,
            status: 'success',
            message: 'Assets retrieved successfully',
            data,
            totalItems,
            totalPages,
            currentPage
        }

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (err) {
        console.error('GET ASSETS ERROR: ', err);
        return next(err);
    }
}

