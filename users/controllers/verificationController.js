const flutterwave = require('../../config/fluterwave');
const cscsAPI = require('../../config/cscs');
const AppError = require('../../config/appError');
const db = require('../../models/index');
const Customer = db.customers;
const Asset = db.assets;
const moment = require('moment');
const xmlBuilder = require('../../config/xmlBuilder');
const strSimilar = require('string-similarity');
const verifyme = require('../../config/verifyme');
const _ = require('underscore');

exports.verifyBVN = async (req, res, next) => {
    try {
        let {bvn, dob, firstname, lastname} = req.body;
        if (!bvn) return next(new AppError('BVN is required', 400));
        const bvnExists = await Customer.findOne({where: {bvn}});
        if (bvnExists) return next(new AppError('A user is already signed up with this bvn', 409));

        //verify bvn using VerifyMe implementation
        const response = await verifyme.verifyBVN(bvn, firstname, lastname);

        // verify bvn using flutterwave implementation
        // const response = await flutterwave.verifyBVN(bvn);
        // let formattedDOB = moment(dob).format('DD/MM/YYYY')
        // let formattedBVNDate = moment(response.data.date_of_birth).format('DDMMYYYY');

        if (response?.status !== 'success') return next(new AppError(response.message ? response.message : "Failed to verify BVN",
            response.statusCode ? response.statusCode : 400));
        let formattedDOB = moment(dob).format('DDMMYYYY');
        let formattedBVNDate = response?.data?.birthdate.replace(/-/g, '');

        console.log(formattedBVNDate, formattedDOB);

        if (formattedDOB != formattedBVNDate) return next(new AppError('Entered date of birth does not match bvn details', 403));

        let resp = {
            code: 200,
            status: 'success',
            data: response?.data
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.verifyNIN = async (req, res, next) => {
    try {
        let request = ['nin', 'firstName', 'lastName'];
        request.map(item => {
            if (!req.body[item]) return next(new AppError(`${item} is required.`, 400));
        })
        let data = _.pick(req.body, request);
        const ninExists = await Customer.findOne({where: {nin: data.nin}});
        if (ninExists) return next(new AppError('A user is already signed up with this NIN', 409));
        const response = await verifyme.verifyNIN(data.nin, data.firstName, data.lastName);
        if (response.status !== 'success') return next(new AppError(response.message, response.statusCode));
        // console.log(response.data.birthdate)
        // let formattedDOB = moment(data.dob).format('DD/MM/YYYY')
        // let formattedBVNDate = moment(response.data.birthdate).format('DD/MM/YYYY');
        // let formattedBVNDate = new Date(response.data.birthdate);
        // let formattedDOB = new Date(data.dob);
        // console.log(formattedBVNDate, formattedDOB);
        console.log(response.data.lastname)
        if (data.lastName.toUpperCase() != response.data.lastname) return next(new AppError('Name does not match nin details', 403));
        let resp = {
            code: 200,
            status: 'success',
            data: response.data
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.verifyCSCS = async (req, res, next) => {
    try {
        let userId;
        if (req.user.role === 'customer') userId = req.user.id;
        if (req.user.role === 'broker') userId = req.body.customerId;
        let {cscsNo, customerId} = req.body;
        if (!userId) return next(new AppError('userId requierd.', 400));
        if (!userId) return next(new AppError('userid is required', 400));
        if (!cscsNo) return next(new AppError('CSCS is required', 400));
        const cscsExists = await Customer.findOne({where: {cscs: cscsNo}});
        if (cscsExists && cscsExists.id != userId) return next(new AppError('A user is already signed up with this cscs', 409));
        const user = await Customer.findByPk(userId);
        if (!user) return next(new AppError('user not found.', 404));
        const response = await cscsAPI.verifyCSCS(cscsNo);

        if(response.ResponseCode != 200) return next(new AppError('CSCS Number not valid', 404));
        if(!response) return next(new AppError('Error verifying CSCS', 500));
        let fullName = `${user.firstName} ${user.lastName} ${user.middleName}`;
        fullName = fullName.toUpperCase();
        let compareResult = strSimilar.compareTwoStrings(fullName, response.AccountName);
        let percentageCorrect = compareResult * 100;
        console.log(percentageCorrect)
        if(percentageCorrect < 73) return next(new AppError('invalid cscs number.', 400));

        await Customer.update({
            cscsVerified: true,
            //cscs: response.CscsNo
            cscs: cscsNo
        }, {
            where: {id: userId}
        });

        let resp = {
            code: 200,
            status: 'success',
            message: 'CSCS number updated.',
            data: response
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.verifyCustomerMTN = async (req, res, next) => {
    try {
        let msisdn = req.body.resource;

        if (!msisdn || msisdn === "") {
            let error = xmlBuilder.verifyResponse(null, null, 102, "msisdn required");
            res.send(error);
            let resp = {
                code: 400,
                status: 'error',
                message: "msisdn required. " + msisdn
            }
            res.locals.resp = resp;
            return next();
        }

        let pruned = msisdn.slice(4, 17)
        pruned = pruned.substring(3)
        pruned = `0${pruned}`;
        console.log(msisdn, pruned);
        const user = await Customer.findOne({where: {phone: pruned}});
        if (!user) {
            let error = xmlBuilder.verifyResponse(null, null, 102, "Phone number matching query does not exist");
            res.send(error);
            let resp = {
                code: 404,
                status: 'error',
                message: "Phone number matching query does not exist. " + msisdn
            }
            res.locals.resp = resp;
            return next();
        }
        const assets = await Asset.findAll({where: {openForPurchase: true}});
        let asset = assets[0];
        const response = xmlBuilder.verifyResponse(`${user.firstName} ${user.lastName} ${user.middleName}`, asset.id, 101, 'SUCCESS');
        res.send(response);
        let resp = {
            code: 200,
            status: 'success',
            message: "user retrieved."
        }
        res.locals.resp = resp;
        return next();
    } catch (error) {
        console.error(error)
        let err = xmlBuilder.verifyResponse(null, null, 102, "server error");
        res.send(err);
        let resp = {
            code: 500,
            status: 'error',
            message: error.message
        }
        res.locals.resp = resp;
        return next();
    }
}

exports.verifyNUBAN = async (req, res, next) => {
    try {
        let verifyMeResponse = {};
        let response = {};
        let flutterWaveResponse = {};

        let {nuban, bank_code} = req.body;
        if (!nuban || !bank_code) return next(new AppError('Bank code and nuban required', 400));

        verifyMeResponse = await verifyme.verifyNUBAN(bank_code, nuban);

        if (verifyMeResponse.status !== 'success') {
            flutterWaveResponse = await flutterwave.verifyAccount(nuban, bank_code);
            if (flutterWaveResponse.status !== 'success') {
                return next(new AppError(flutterWaveResponse.message, flutterWaveResponse.statusCode));
            } else {
                response = flutterWaveResponse;
            }
        } else {
            response = verifyMeResponse;
        }


        let resp = {
            code: 200,
            status: 'success',
            data: response.data
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getBVNDetails = async (req, res, next) => {
    try {
        let bvn = req.params.bvn;

        const response = await verifyme.verifyBVN(bvn);

        if (!response) {
            return next(new AppError('BVN details not found', 404));
        }

        if (response.status !== 'success') {
            return next(new AppError(response.message, response.statusCode));
        }

        let resp = {
            code: 200,
            status: 'success',
            data: response.data
        };

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        console.error('Error from GetBVNDetails: ', error);
        return next(error);
    }
}

exports.updateCSCSNoVerification = async (req, res, next) => {
    try {
        let userId;
        if (req.user.role === 'customer') userId = req.user.id;
        if (req.user.role === 'broker') userId = req.body.customerId;
        let {cscsNo, customerId} = req.body;
        if (!userId) return next(new AppError('userId requierd.', 400));
        if (!userId) return next(new AppError('userid is required', 400));
        if (!cscsNo) return next(new AppError('CSCS is required', 400));
        const cscsExists = await Customer.findOne({where: {cscs: cscsNo}});
        if (cscsExists && cscsExists.id != userId) return next(new AppError('A user is already signed up with this cscs', 409));
        const user = await Customer.findByPk(userId);
        if (!user) return next(new AppError('user not found.', 404));
        const response = await cscsAPI.verifyCSCS(cscsNo);

        if(response.ResponseCode != 200) return next(new AppError('CSCS Number not valid', 404));
        if(!response) return next(new AppError('Error verifying CSCS', 500));
        // let fullName = `${user.firstName} ${user.lastName} ${user.middleName}`;
        // fullName = fullName.toUpperCase();
        // let compareResult = strSimilar.compareTwoStrings(fullName, response.AccountName);
        // let percentageCorrect = compareResult * 100;
        // console.log(percentageCorrect)
        // if(percentageCorrect < 73) return next(new AppError('invalid cscs number.', 400));

        await Customer.update({
            cscsVerified: true,
            //cscs: response.CscsNo
            cscs: cscsNo
        }, {
            where: {id: userId}
        });

        let resp = {
            code: 200,
            status: 'success',
            message: 'CSCS number updated.',
            data: response
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (err) {
        console.error('Error from updateCSCSNoVerification: ', err);
        return next(err);
    }
}
