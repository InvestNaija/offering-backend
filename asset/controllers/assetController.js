const db = require('../../models/index');
const AppError = require('../../config/appError');
const Asset = db.assets;
const Reservation = db.reservations;
const Customer = db.customers;
const cloudinary = require('../../config/cloudinary');
const _ = require('underscore');
const {sendEmail} = require('../../config/email');


exports.create = async(req, res, next) => {
    try {
        let data = _.pick(req.body, ['name', 'type', 'anticipatedMaxPrice', 'anticipatedMinPrice',
            'sharePrice', 'availableShares', 'openForPurchase', 'closingDate', 'description', 'currency']);

        // if subaccount id was passed
        if (req.body.subaccountId) {
            data.subaccountId = req.body.subaccountId;
        }
        else {
            data.subaccountId = 'null';
        }

        // check if currency is passed
        if (!data.currency) {
            data.currency = 'NGN';
        }

        data.closingDate = new Date(data.closingDate);
        const asset = await Asset.create(data);
        resp = {
            code: 201,
            status: 'success',
            message: 'Asset successfully created',
            data: asset
        }
        res.status(resp.code).json(resp);
        let {image} = req.body;
        res.locals.resp = resp;
        if(image) {
            const response = await cloudinary.uploadImage(image);
            if(response.secure_url) await Asset.update({image: response.secure_url}, {where: {id: asset.id}});
            console.log('asset image updated');
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.edit = async(req, res, next) => {
    try {
        let assetId = req.params.id;
        let data = _.pick(req.body, ['name', 'type', 'anticipatedMaxPrice', 'anticipatedMinPrice',
            'sharePrice', 'availableShares', 'openForPurchase', 'closingDate', 'description', 'currency']);

        // if subaccount id was passed
        if (req.body.subaccountId) {
            data.subaccountId = req.body.subaccountId;
        }
        else {
            data.subaccountId = 'null';
        }

        // check if currency is passed
        if (!data.currency) {
            data.currency = 'NGN';
        }

        data.closingDate = new Date(data.closingDate);
        await Asset.update(data, {where: {id: assetId}});
        resp = {
            code: 200,
            status: 'success',
            message: 'Asset successfully updated',
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        let {image} = req.body;
        if(image) {
            const response = await cloudinary.uploadImage(image);
            // console.log(response.secure_url);
            if(response.secure_url) await Asset.update({image: response.secure_url}, {where: {id: assetId}});
            console.log('asset image updated');
        }
        if(data.openForPurchase) {
            const pendingReservations = await Reservation.findAll({where: {assetId, paid: false}, include: ['customer', 'asset']})
            if(pendingReservations.length > 0) {
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
                        <p>For further enquiries, please send an <a href = "mailto: investnaija@chapelhilldenham.com">email</a> to investnaija@chapelhilldenham.com or call < phone number>.</p>
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

exports.getAll = async(req, res, next) => {
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

exports.getOne = async(req, res, next) => {
    try {
        let assetid = req.params.id;
        if(!assetid) return next(new AppError('assedId required', 400));
        const asset = await Asset.findByPk(assetid);
        if(!asset) return next(new AppError('asset not found', 404));
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

exports.getOpen = async(req, res, next) => {
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

exports.getPopular = async(req, res, next) => {
    try {
        const assets = await Asset.findAll({order: [
            ['popularity', 'DESC']
        ]})
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

exports.getTop = async(req, res, next) => {
    try {
        const assets = await Asset.findAll({order: [
            ['sharePrice', 'DESC']
        ]})
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



