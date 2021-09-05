const db = require('../../models/index');
const AppError = require('../../config/appError');
const bcrypt = require('bcryptjs');
const auth = require('../../auth/authController');
const Wallet = db.wallets;
const Customer = db.customers;
const Token = db.tokens;
const Beneficiary = db.beneficiaries;
const Broker = db.brokers;
const CscsLog = db.cscsLogs;
const _ = require('underscore');
const helper = require('../../config/helper');
const zanibal = require('../../config/zanibal');
const cscs = require('../../config/cscs');
const sendEmail = require('../../config/email');
const moment = require('moment');
const crypto = require('crypto');
const cloudinary = require('../../config/cloudinary');
const flutterwave = require('../../config/fluterwave');
const formidable = require('formidable');
const verifyme = require('../../config/verifyme');
const accessgateway = require('../../config/accessgateway');
const KycDocuments = db.kycDocuments;
const path = require('path');
const {Op} = require('sequelize');
const {getPagination, getPagingData} = require("../../config/pagination");
require('dotenv').config();


exports.signup = async (req, res, next) => {
    try {
        let brokerId;
        let broker;
        if (req.user) {
            brokerId = req.user.id;
            broker = await Broker.findByPk(brokerId)
        }
        let request = ['firstName', 'lastName', 'email', 'password', 'nin', 'bvn', 'address',
            'gender', 'dob', 'phone', 'placeOfBirth', 'mothersMaidenName'];

        for (let i = 0; i < request.length; i++) {
            if (!req.body[request[i]] || req.body[request[i]] === "") {
                return next(new AppError(`${request[i]} is required`, 400));
            }
        }

        request.push('middleName', 'bvn');
        let post = _.pick(req.body, request);
        let dob = moment(post.dob)
        if (!dob.isValid()) {
            // let date = post.dob.replace(/-/g, '/');
            let date = moment(post.dob, 'DD-MM-YYYY').format('YYYY-MM-DD');
            console.log(date);
            if (!moment(date).isValid()) return next(new AppError('invalid date format', 400));
            dob = date;
        }
        // console.log(dob.isValid());
        post.dob = dob;
        post.gender = post.gender.toLowerCase();
        if (post.gender.charAt(0) === 'm') post.gender = 'male';
        else if (post.gender.charAt(0) === 'f') post.gender = 'female';
        else post.gender = 'other';
        post.email = post.email.toLowerCase();
        console.log(post);
        let password = bcrypt.hashSync(post.password, 12);
        const emailExists = await Customer.findOne({where: {email: post.email}});
        if (emailExists) return next(new AppError('A user is already signed up with this email', 409));
        // const bvnExists = await Customer.findOne({where: {bvn: post.bvn}});
        const ninExists = await Customer.findOne({where: {nin: post.nin}});
        const bvnExists = await Customer.findOne({where: {bvn: post.bvn}});
        if (bvnExists) return next(new AppError('A user is already signed up with this BVN', 409));
        if (ninExists) return next(new AppError('A user is already signed up with this NIN', 409));
        post.password = password;
        post.dob = new Date(post.dob);
        if (broker) {
            post.brokerId = broker.id;
            post.accountType = 'broker';
        }

        // set mother's maiden name
        if (req.body.mothersMaidenName) {
            post.mothersMaidenName = req.body.mothersMaidenName;
        } else {
            post.mothersMaidenName = null;
        }

        // save customer to database
        const customer = await Customer.create(post);

        let resp = {
            code: 201,
            status: 'success',
            data: customer,
            message: 'customer signup success. check your email for otp.'
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;

        let otp = helper.generateOTCode(6, false);
        const token = await Token.create({token: otp, customerId: customer.id});
        let url = `${process.env.FRONTEND_URL}/auth/verify-otp`
        // ***** notification with otp sent to customer
        let opts = {
            email: customer.email,
            subject: 'Verify Your Account',
            message: `<p>Hello ${customer.firstName},</p>
            <p>Welcome to InvestNaija, your token is <b>${token.token}</b>.</p>
            <p>Please follow this <a href="${url}">link</a> to verify your account</b></p>
            <p>Best Regards,</p>
            <p>Chapel Hill Denham</p>
            `
        }
        sendEmail(opts).then(r => console.log('OTP email sent to customer: ' + customer.email)).catch(err => console.log('error sending otp email', err));

        return next();
    } catch (error) {
        return next(error);
    }
}

exports.resendOTP = async (req, res, next) => {
    try {
        let {email} = req.body;
        if (!email) return next(new AppError('Email is required', 400));
        const customer = await Customer.findOne({where: {email}});
        if (!customer) return next(new AppError('User not found. Please signup to continue', 404));
        let otp;
        let tokenExists = await Token.findOne({where: {used: false, customerId: customer.id}});
        if (tokenExists) otp = tokenExists.token;
        else {
            otp = helper.generateOTCode(6, false);
            const token = await Token.create({token: otp, customerId: customer.id});
        }
        let opts = {
            email: customer.email,
            subject: 'Verify Your Account',
            message: `<p>Hello ${customer.firstName},</p>
            <p>Please enter this code to verify your account.</p>
            <p><b>${otp}</b></p>
            <p>Best Regards,</p>
            <p>The Invest Naija Team.</p>
            `
        }
        sendEmail(opts)
            .then(r => {
                console.log('OTP email sent to customer: ' + customer.email)
                let resp = {
                    code: 200,
                    status: 'success',
                    message: 'check your email for otp.'
                }
                res.status(resp.code).json(resp);
                res.locals.resp = resp;
                return next();
            })
            .catch(err => {
                console.log('error sending otp email', err)
                return next(new AppError('Error sending otp. Please retry', 500));
            })
    } catch (error) {
        return next(error);
    }
}

exports.forgotPasswordCustomer = async (req, res, next) => {
    try {
        let {email, baseUrl} = req.body;
        let url = "";
        const user = await Customer.findOne({where: {email}});
        if (!user) return next(new AppError('user not found.', 404));
        let str = crypto.randomBytes(16).toString("hex");
        const token = await Token.create({token: str, customerId: user.id});
        if (!token) return next(new AppError('error creating password reset', 500));

        if (baseUrl) {
            url = `${baseUrl}/auth/reset-password?token-details=${token.token}`;
        } else {
            url = `${process.env.FRONTEND_URL}/auth/reset-password?token-details=${token.token}`;
        }

        let opts = {
            email: user.email,
            subject: 'Password Reset',
            message: `<p>Hello ${user.firstName},</p>
            <p>Follow this link to reset your account's password:</p>
            <p><a href="${url}">Reset</a></p>
            `
        }
        sendEmail(opts).then(r => {
            console.log('password reset email sent');
            let resp = {
                code: 200,
                status: 'success',
                message: 'Password reset email sent. Please check your mail.'
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;
            return next();
        }).catch(err => {
            console.log('error sending password reset', err);
            return next(new AppError('Error sending password reset email. Please try again.', 500));
        })
    } catch (error) {
        return next(error);
    }
}

exports.resetPasswordCustomer = async (req, res, next) => {
    try {
        let token = req.params.token;
        if (!token) return next(new AppError('token is required', 400));
        let {password, confirmPassword} = req.body;
        if (!password || !confirmPassword) return next(new AppError('password and confirmPassword is required', 400));
        if (password !== confirmPassword) return next(new AppError('password and confirmPassword do not match', 400));
        const tokenExists = await Token.findOne({where: {token}});
        if (!tokenExists || tokenExists.used) return next(new AppError('invalid or expired token', 401));
        let customerId = tokenExists.customerId;
        if (!customerId) return next(new AppError('invalid customer', 401));
        let hash = bcrypt.hashSync(password, 12);
        await Customer.update({password: hash}, {where: {id: customerId}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'Password reset successful.'
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.verifyCustomer = async (req, res, next) => {
    try {
        let {email, otp} = req.body;
        if (!email || !otp) return next(new AppError('User email and otp is required', 400));
        let token = await Token.findOne({where: {token: otp, used: false}, include: 'customer'});
        if (!token) return next(new AppError('Invalid OTP', 404));
        token = JSON.stringify(token, null, 2);
        token = JSON.parse(token);
        if (token.used) return next(new AppError('Invalid OTP', 403));
        if (token.customer.email !== email) return next(new AppError('Invalid token/user pair', 403));
        if (token.customer.verified) return next(new AppError('User has already been verified', 409));

        await Token.update({used: true}, {where: {id: token.id}});
        await Customer.update({verified: true, status: 'active'}, {where: {id: token.customer.id}});
        const wallet = await Wallet.create({customerId: token.customer.id});
        let resp = {
            code: 200,
            status: 'success',
            message: 'User verification successful'
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        // **** Register user on zannibal and update id on profile
        // const response = await zanibal.registerCustomer(token.customer.firstName, token.customer.lastName,
        //     token.customer.email, token.customer.phone, token.customer.bvn);
        // if (response.success) await Customer.update({zanibalId: response.msgCode}, {where: {id: token.customer.id}});
        // else console.log('Error registering customer on zanibal;', response);
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.login = async (req, res, next) => {
    try {
        let {email, password} = req.body;
        if (!email || !password) return next(new AppError('User\'s email and password required', 400));
        email = email.toLowerCase();
        const user = await Customer.findOne({where: {email}});
        if (!user) return next(new AppError('Invalid email.', 404));
        if (!user.verified) return next(new AppError('Please verify your account to proceed.', 411));
        let correctPassword = bcrypt.compareSync(password, user.password);
        if (!correctPassword) return next(new AppError('Invalid email/password combination.', 406));
        let signature = {
            id: user.id,
            role: user.role
        }
        const token = auth.createAccessToken(signature);
        let resp = {
            code: 200,
            status: 'success',
            data: user,
            message: 'Customer login success',
            token
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.changePassword = async (req, res, next) => {
    try {
        let id = req.user.id
        let {oldPassword, newPassword} = req.body;
        if (!oldPassword || !newPassword) return next(new AppError('New and old passwords required', 406));
        const customer = await Customer.findByPk(id);
        const correctPassword = bcrypt.compareSync(oldPassword, customer.password);
        if (!correctPassword) return next(new AppError('Incorrect old password entered', 401));
        let hash = bcrypt.hashSync(newPassword, 12);
        await Customer.update({password: hash}, {where: {id}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'broker Password updated'
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.edit = async (req, res, next) => {
    try {
        let customerId = req.user.id;
        let request = ['address', 'description', 'phone', 'twitter', 'facebook', 'linkedIn',
            'youtube', 'website', 'placeOfBirth'];
        let data = _.pick(req.body, request);
        data.mothersMaidenName = req.body.motherMaidenName;

        await Customer.update(data, {where: {id: customerId}});

        let customer = await Customer.findByPk(customerId);

        let resp = {
            code: 200,
            status: 'success',
            message: 'Customer profile update success.',
            data: customer
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getProfile = async (req, res, next) => {
    try {
        let id = req.user.id;
        const user = await Customer.findByPk(id);
        res.status(200).json({
            status: 'success',
            data: user
        })
    } catch (error) {
        return next(error);
    }
}

exports.updateBankAccount = async (req, res, next) => {
    try {
        let id = req.user.id;
        let request = ['bankAccountName', 'bankName', 'bankCode', 'nuban'];
        request.map(i => {
            if (!req.body[i]) return next(new AppError(i + ' required.', 400));
        })
        let {password} = req.body;
        if (!password) return next(new AppError('password required', 400));
        const customer = await Customer.findByPk(id);
        if (!customer) return next(new AppError('customer invalid.', 404));
        const passwordCorrect = bcrypt.compareSync(password, customer.password);
        if (!passwordCorrect) return next(new AppError('incorrect password.', 401));
        let data = _.pick(req.body, request);
        data.accountDetailsVerified = true;
        await Customer.update(data, {where: {id}})
        let resp = {
            code: 200,
            status: 'success',
            message: 'Bank Account updated.'
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}


exports.editAvatar = async (req, res, next) => {
    try {
        let id = req.user.id;
        let {image} = req.body;
        if (!image) return next(new AppError('Image required.', 400));
        let result = await cloudinary.uploadImage(image)
        if (result.secure_url) await Customer.update({image: result.secure_url}, {where: {id}});
        else return next(new AppError('Error uploading image.', 500));
        let resp = {
            code: 200,
            status: 'success',
            message: 'Profile picture updated.'
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.uploadKYC = async (req, res, next) => {
    try {
        let id = req.user.id;
        const form = new formidable({multiples: true});
        let files = {};
        let fields = {};
        form.on('file', (name, file) => {
            files[name] = file
        })
            .on('field', (name, field) => {
                fields[name] = field
            })
            .on('end', async () => {
                // console.log(fields, files);
                let resp = {
                    code: 200,
                    status: 'success',
                    message: 'Documents Uploaded.'
                }
                res.status(resp.code).json(resp)
                let validfields = ['driverLicenseNo', 'passportNo', 'nationalIdNo', 'utilityNo'];
                let validfiles = ['driverLicense', 'passport', 'nationalId', 'utility'];
                for (const key in fields) {
                    if (validfields.indexOf(key) > -1) {
                        let update = {};
                        update[key] = fields[key]
                        await Customer.update(update, {where: {id}});
                        // console.log(update);
                    }
                }

                for (const key in files) {
                    if (validfiles.indexOf(key) > -1) {
                        let img = files[key].path;
                        let result = await cloudinary.uploadImage(img);
                        if (result.secure_url) {
                            let update = {};
                            update[key] = result.secure_url;
                            await Customer.update(update, {where: {id}});
                            // console.log(update);
                        }
                    }
                }

                res.locals.resp = resp;
                return next();

            })
        form.parse(req);
    } catch (error) {
        return next(error);
    }
}

exports.fetchDocuments = async (req, res, next) => {
    try {
        let id = req.user.id;
        const customer = await Customer.findByPk(id);
        if (!customer) return next(new AppError('invalid customer', 404));
        let data = {
            driverLicense: customer.driverLicense,
            driverLicenseNo: customer.driverLicenseNo,
            passport: customer.passport,
            passportNo: customer.passportNo,
            nationalId: customer.nationalId,
            nationalIdNo: customer.nationalIdNo,
            utility: customer.utility,
            utilityNo: customer.utilityNo
        }
        let resp = {
            code: 200,
            status: 'success',
            message: 'customer\'s documents fetched',
            data
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.get = async (req, res, next) => {
    try {
        let {page, size, search} = req.query;
        let customers = [];

        if (page && page >= 0) {
            page = page - 1;
        } else {
            page = 0;
        }

        const {limit, offset} = getPagination(page, size);

        let query = {
            limit,
            offset,
            distinct: true,
            order: [
                ['createdAt', 'DESC']
            ],
        };

        if (search) {
            let item = {
                [Op.or]: [
                    {firstName: {[Op.iLike]: `%${search}%`}},
                    {lastName: {[Op.iLike]: `%${search}%`}},
                    {middleName: {[Op.iLike]: `%${search}%`}}
                ]
            };

            query.where = item;
        }

        customers = await Customer.findAndCountAll(query);

        let {data, totalItems, totalPages, currentPage} = getPagingData(customers, page, limit);

        let resp = {
            code: 200,
            status: 'success',
            message: 'All customers retrieved successfully',
            data,
            totalItems,
            totalPages,
            currentPage
        }

        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.fetch = async (req, res, next) => {
    try {
        let customerId = req.params.id;
        const customer = await Customer.findByPk(customerId);
        let resp = {
            code: 200,
            status: 'success',
            message: 'customer fetched',
            data: customer
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.count = async (req, res, next) => {
    try {
        const count = await Customer.count();
        let resp = {
            code: 200,
            status: 'success',
            message: 'customers count fetched',
            count
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getBrokerCustomers = async (req, res, next) => {
    try {
        let brokerId = req.user.id;
        const customers = await Customer.findAll({where: {brokerId}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'broker\'s customers fetched',
            data: customers
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.brokerCustomersCount = async (req, res, next) => {
    try {
        let brokerId = req.user.id;
        const count = await Customer.count({where: {brokerId}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'broker\'s customers count fetched',
            count
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.createCSCSAccount = async (req, res, next) => {
    try {
        if (!req.user) return next(new AppError('Please login to access this resource', 401));
        let customerId;
        let customer;
        if (req.user.role === 'customer') {
            customerId = req.user.id;
            customer = await Customer.findByPk(customerId);
        } else {
            let {bvn} = req.body;
            if (!bvn) return next(new AppError('customer BVN is required', 400));
            customer = await Customer.findOne({where: {bvn}});
            if (!customer) return next(new AppError('No customer found with entered bvn.', 404));
            customerId = customer.id;
        }
        if (!customer) return next(new AppError('Customer not found', 404));
        if (!customerId) return next(new AppError('customerId is required.', 400));
        if (!customer.nuban) return next(new AppError('Update bank details to proceed.', 403));
        let request = ['City', 'Country', 'Citizen', 'MaidenName'];
        let data = _.pick(req.body, request);
        request.map(item => {
            if (!req.body[item]) return next(new AppError(`${item} is required`, 400));
        })

        if (customer.cscsVerified) return next(new AppError('Your CSCS number has already been verified', 409));
        if (customer.cscsRequestStatus === 'requested') return next(new AppError('Your CSCS account creation is currently being processed', 409));
        if (customer.gender === 'male') data.Gender = 'M';
        else if (customer.gender === 'female') data.Gender = 'F';

        data.BirthDate = moment(customer.dob).format('YYYYMMDD');
        data.Address1 = customer.address.slice(0, 39);
        data.Phone1 = customer.phone;
        data.Email = customer.email;
        data.MadianName = data.MaidenName;
        data.CPPhone = customer.phone;
        data.CPName = customer.firstName;
        data.State = "LG";
        data.LGA = "Epe";
        data.RefNo = parseInt(helper.generateOTCode(6, false));
        data.BVN = customer.bvn;
        data.BankAccountname = customer.bankAccountName;
        data.BankAccNo = customer.nuban;
        data.BankName = customer.bankName;
        data.Name = `${customer.firstName} ${customer.lastName} ${customer.middleName}`;
        delete data.MaidenName;
        delete data.BankAccountName;
        // console.log(data);
        const response = await cscs.createCSCS(data);
        // console.log(response)
        if (!response) return next(new AppError("cscs server error", 512));
        let logData = JSON.stringify(data);
        const cscslog = await CscsLog.create({request: logData, customerId});

        if (response.response_code != 200) {
            await Customer.update({
                cscsRef: data.RefNo,
                cscsRequestStatus: 'request-failure',
                cscsRequestFailureReason: response.response_message
            }, {where: {id: customerId}});
            let responseData = JSON.stringify(response);
            await CscsLog.update({response: responseData}, {where: {id: cscslog.id}});
            let resp = {
                code: 200,
                status: 'success',
                message: 'Your CSCS account creation is in progress, we would get back to you shortly',
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;
            return next();
        } else {
            let responseData = JSON.stringify(response);
            await CscsLog.update({response: responseData}, {where: {id: cscslog.id}});
            await Customer.update({cscsRef: data.RefNo, cscsRequestStatus: 'requested'}, {where: {id: customerId}});

            let resp = {
                code: 200,
                status: 'success',
                message: 'Your CSCS account creation is in progress, we would get back to you shortly',
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;
            let opts = {
                email: customer.email,
                subject: 'CSCS Account Creation Initiated',
                message: `<p>Hello ${customer.firstName},</p>
                <p>Your CSCS account creation has successfully been initiated.</p>
                <p>You'll be notified once the process is complete.</p>
                <p>Best Regards,</p>
                <p>Chapel Hill Denham</p>
                `
            }
            sendEmail(opts).then(r => console.log('CSCS initiation email sent')).catch(err => console.log('error sending CSCS initiation email', err))
            return next();
        }

    } catch (error) {
        return next(error);
    }
}

exports.signupViaMTN = async (req, res, next) => {
    try {
        let data = {};
        let {nin, bvn, cscsExist, firstName, lastName, email} = req.body;
        if (!bvn) return next(new AppError('bvn required', 400));
        if (!firstName || !lastName) return next(new AppError('firstName and lastName required', 400));
        if (!nin) return next(new AppError('nin required', 400));
        if (cscsExist === undefined) return next(new AppError('cscsExist required', 400));
        if (typeof (cscsExist) !== 'boolean') return next(new AppError('cscs status requires boolean type', 400));
        let request = ['email', 'address', 'gender'];
        request.map(item => {
            if (!req.body[item]) return next(new AppError(`${item} is required`, 400));
            data[item] = req.body[item]
        })
        const bvnExists = await Customer.findOne({where: {bvn}});
        const userExists = await Customer.findOne({where: {email}});
        if (userExists) return next(new AppError('user already signed up with this email', 400))
        const ninExists = await Customer.findOne({where: {nin}});
        if (ninExists) return next(new AppError('A user is already signed up with this nin', 409));
        if (bvnExists) return next(new AppError('A user is already signed up with this bvn', 409));

        const ninResponse = await verifyme.verifyNIN(nin, firstName, lastName);
        if (!ninResponse) return next(new AppError("invalid NIN", 400));
        // console.log(ninResponse.data);
        let password = helper.generateOTCode(6, true);
        let hash = bcrypt.hashSync(password, 12);
        data.dob = moment(ninResponse.data.birthdate, 'DD-MM-YYYY').format();
        console.log(data.dob);
        data.firstName = firstName;
        data.lastName = lastName;
        data.middleName = ninResponse.data.middlename;
        data.phone = ninResponse.data.phone;
        data.bvn = bvn;
        data.email = email;
        data.accountType = 'mtn'
        data.password = hash;
        data.verified = true;
        let customer;
        console.log(data);
        if (!cscsExist) {
            let cscsData = {};
            let cscsObj = req.body.cscsData;
            if (!cscsObj) return next(new AppError('cscsData is required', 400));
            let cscsRequest = ['City', 'Country', 'Citizen', 'MotherMaidenName', 'BankCode', 'BankAccNo', 'State', 'LGA'];
            cscsRequest.map(item => {
                if (!cscsObj[item]) return next(new AppError(`${item} is required`, 400));
                cscsData[item] = cscsObj[item];
            })
            customer = await Customer.create(data);
            let resp = {
                code: 200,
                status: 'success',
                message: 'customer signup successful',
                data: customer
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;
            let bankResolver = await flutterwave.listBanks();
            let bank = bankResolver.data.filter(obj => obj.code === cscsData.BankCode)
            // console.log(bank[0].name);
            let accResolver = await flutterwave.verifyAccount(cscsData.BankAccNo, cscsData.BankCode);
            // console.log(accResolver.data.account_name);
            if (data.gender === 'male') cscsData.Gender = 'M';
            else if (data.gender === 'female') cscsData.Gender = 'F';
            cscsData.MadianName = cscsData.MotherMaidenName
            cscsData.Address1 = data.address.slice(0, 39);
            cscsData.BirthDate = moment(ninResponse.data.birthdate, 'DD-MM-YYYY').format();
            cscsData.Phone1 = data.phone;
            cscsData.Email = data.email;
            cscsData.CPPhone = data.phone;
            cscsData.CPName = data.firstName;
            cscsData.RefNo = helper.generateOTCode(6, false);
            cscsData.BVN = data.bvn;
            cscsData.Name = `${ninResponse.data.firstname} ${ninResponse.data.middlename} ${ninResponse.data.lastname}`
            cscsData.BankName = bank[0].name
            cscsData.BankAccountname = accResolver.data.account_name
            delete cscsData.MotherMaidenName;
            delete cscsData.BankCode;
            console.log(cscsData);
            const cscsResponse = await cscs.createCSCS(cscsData);
            console.log(cscsResponse)
            if (!cscsResponse) return next(new AppError('error creating your cscs account', 512));
            let logData = JSON.stringify(data);
            const cscslog = await CscsLog.create({request: logData, customerId: customer.id});
            if (cscsResponse.response_code !== 200) {
                await Customer.update({
                    cscsRef: cscsData.RefNo,
                    cscsRequestStatus: 'request-failure',
                    cscsRequestFailureReason: cscsResponse.response_message
                }, {where: {id: customer.id}});
                let responseData = JSON.stringify(cscsResponse);
                await CscsLog.update({response: responseData}, {where: {id: cscslog.id}});
                // return next(new AppError(`Error creating CSCS account: ${response.response_message}.`, 400));
                console.log('CSCS creation response: ', cscsResponse.response_message);
            }
            let responseData = JSON.stringify(cscsResponse);
            await CscsLog.update({response: responseData}, {where: {id: cscslog.id}});
            await Customer.update({
                cscsRef: cscsData.RefNo,
                cscsRequestStatus: 'requested'
            }, {where: {id: customer.id}});
            console.log('CSCS request success');
        } else {
            let {cscsNo} = req.body;
            if (!cscsNo) return next(new AppError('cscsNo is required.', 400));
            const cscsExists = await Customer.findOne({where: {cscs: cscsNo}});
            if (cscsExists) return next(new AppError('A user is already signed up with this cscs', 409));
            const cscsResponse = await cscs.verifyCSCS(cscsNo);
            if (!cscsResponse) return next(new AppError('Error occured while verifying your CSCS number', 512));
            if (cscsResponse.ResponseCode !== 200) return next(new AppError('CSCS Number not valid', 404));
            if (cscsResponse.error) return next(new AppError('Error occured while verifying your CSCS number', 512));
            data.cscs = cscsResponse.CscsNo;
            data.cscsVerified = true;
            customer = await Customer.create(data);
            let resp = {
                code: 200,
                status: 'success',
                message: 'customer signup successful',
                data: customer
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;
        }
        // *** send onboarding message
        let opts = {
            email: customer.email,
            subject: 'Account created',
            message: `<p>Hello ${customer.firstName},</p>
            <p>Your account has been successfully created.</p>
            <p>Username: <b>${customer.email}</b></p>
            <p>Password: <b>${password}</b></p>
            <p>Kindly log in on the platform to change your password.</b></p>
            <p>Best Regards,</p>
            <p>Chapel Hill Denham</p>         `
        }
        sendEmail(opts).then(r => console.log('Onboarding email sent to customer: ' + customer.email)).catch(err => console.log('Error sending onboarding email to customer.', err))
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.signupViaMTNWithoutVerifications = async (req, res, next) => {
    try {
        let data = {};
        let {nin, bvn, cscsExist, email, dob, motherMaidenName, placeOfBirth} = req.body;


        if (!bvn) return next(new AppError('bvn required', 400));

        // check if bvn is a number
        if (bvn == '' || isNaN(bvn)) {
            return next(new AppError('bvn should be a number', 400));
        }

        if (!motherMaidenName || !placeOfBirth) return next(new AppError('motherMaidenName and placeOfBirth required', 400));
        //if (!nin) return next(new AppError('nin required', 400));
        if (cscsExist === undefined) return next(new AppError('cscsExist required', 400));
        if (typeof (cscsExist) !== 'boolean') return next(new AppError('cscs status requires boolean type', 400));
        let request = ['email', 'address'];
        request.map(item => {
            if (!req.body[item]) return next(new AppError(`${item} is required`, 400));
            data[item] = req.body[item]
        })

        // check if user passes date of birth and phone number
        if (moment(dob, 'DD-MM-YYYY') === undefined) {
            return next(new AppError('date of birth (dob) is required and should be in the format DD-MM-YYYY', 400));
        }

        const bvnExists = await Customer.findOne({where: {bvn}});
        const userExists = await Customer.findOne({where: {email}});
        if (userExists) return next(new AppError('user already signed up with this email', 400))
        const ninExists = await Customer.findOne({where: {nin}});
        if (ninExists) return next(new AppError('A user is already signed up with this nin', 409));
        if (bvnExists) return next(new AppError('A user is already signed up with this bvn', 409));

        // remove NIN verification
        // const ninResponse = await verifyme.verifyNIN(nin, firstName, lastName);
        // if(!ninResponse) return next(new AppError("invalid NIN", 400));
        // console.log(ninResponse.data);

        // get bvn data from verifyme for verification
        let bvnData = await verifyme.verifyBVN(bvn);
        bvnData = bvnData.data;

        // check if bvn date of birth matches date of birth passed
        let userDob = moment(dob, 'DD-MM-YYYY').format('DD-MM-YYYY');
        if (userDob !== bvnData.birthdate) {
            return next(new AppError(`Date of birth (dob): ${userDob} should be equal to date of birth on BVN.`, 400));
        }

        let password = helper.generatePassword(9, true, true);
        let hash = bcrypt.hashSync(password, 12);
        data.dob = moment(dob, 'DD-MM-YYYY').format();
        console.log(data.dob);
        data.firstName = bvnData.firstname;
        data.lastName = bvnData.lastname;
        data.middleName = bvnData.middlename;
        data.phone = bvnData.phone;
        data.bvn = bvn;
        data.email = email;
        data.accountType = 'mtn'
        data.password = hash;
        data.verified = true;
        data.gender = bvnData?.gender?.toLowerCase();
        data.placeOfBirth = placeOfBirth;
        data.mothersMaidenName = motherMaidenName;

        let customer;
        console.log(data);
        if (!cscsExist) {
            let cscsData = {};
            let cscsObj = req.body.cscsData;
            if (!cscsObj) return next(new AppError('cscsData is required', 400));
            let cscsRequest = ['City', 'Country', 'Citizen', 'BankCode', 'BankAccNo', 'State', 'LGA'];
            cscsRequest.map(item => {
                if (!cscsObj[item]) return next(new AppError(`${item} is required`, 400));
                cscsData[item] = cscsObj[item];
            })
            customer = await Customer.create(data);

            // generate otp to be sent to user email and returned in response
            // let otp = helper.generateOTCode(6, false);
            // const token = await Token.create({token: otp, customerId: customer.id});

            let resp = {
                code: 200,
                status: 'success',
                message: 'customer signup successful',
                data: {
                    bvnData
                }
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;

            // let opts = {
            //     email,
            //     subject: 'Verify Your Account',
            //     message: `<p>Hello ${customer.firstName},</p>
            // <p>Welcome to InvestNaija, your token is <b>${token.token}</b>.</p>
            // <p>Please follow this provide your token to the agent to verify your account.</b></p>
            // <p>Best Regards,</p>
            // <p>The Invest Naija Team.</p>
            // `
            // }
            // sendEmail(opts).then(r => console.log('OTP email sent to customer: ' + email)).catch(err => console.log('error sending otp email', err));

            let bankResolver = await flutterwave.listBanks();
            let bank = bankResolver.data.filter(obj => obj.code === cscsData.BankCode)
            // console.log(bank[0].name);
            let accResolver = await flutterwave.verifyAccount(cscsData.BankAccNo, cscsData.BankCode);
            // console.log(accResolver.data.account_name);
            if (data.gender === 'male') cscsData.Gender = 'M';
            else if (data.gender === 'female') cscsData.Gender = 'F';
            cscsData.MadianName = motherMaidenName;
            cscsData.Address1 = data.address.slice(0, 39);
            cscsData.BirthDate = moment(dob, 'DD-MM-YYYY').format();
            cscsData.Phone1 = data.phone;
            cscsData.Email = data.email;
            cscsData.CPPhone = data.phone;
            cscsData.CPName = data.firstName;
            cscsData.RefNo = helper.generateOTCode(6, false);
            cscsData.BVN = data.bvn;
            cscsData.Name = `${bvnData.firstname} ${bvnData.middlename} ${bvnData.lastname}`
            cscsData.BankName = bank[0].name;
            cscsData.BankAccountname = accResolver.data.account_name;

            delete cscsData.BankCode;

            console.log(cscsData);
            const cscsResponse = await cscs.createCSCS(cscsData);
            console.log(cscsResponse)
            if (!cscsResponse) return next(new AppError('error creating your cscs account', 512));
            let logData = JSON.stringify(data);
            const cscslog = await CscsLog.create({request: logData, customerId: customer.id});
            if (cscsResponse.response_code !== 200) {
                await Customer.update({
                    cscsRef: cscsData.RefNo,
                    cscsRequestStatus: 'request-failure',
                    cscsRequestFailureReason: cscsResponse.response_message
                }, {where: {id: customer.id}});
                let responseData = JSON.stringify(cscsResponse);
                await CscsLog.update({response: responseData}, {where: {id: cscslog.id}});
                // return next(new AppError(`Error creating CSCS account: ${response.response_message}.`, 400));
                console.log('CSCS creation response: ', cscsResponse.response_message);
            }
            let responseData = JSON.stringify(cscsResponse);
            await CscsLog.update({response: responseData}, {where: {id: cscslog.id}});
            await Customer.update({
                cscsRef: cscsData.RefNo,
                cscsRequestStatus: 'requested'
            }, {where: {id: customer.id}});
            console.log('CSCS request success');
        } else {
            let {cscsNo} = req.body;
            if (!cscsNo) return next(new AppError('cscsNo is required.', 400));
            const cscsExists = await Customer.findOne({where: {cscs: cscsNo}});
            if (cscsExists) return next(new AppError('A user is already signed up with this cscs', 409));

            // cscs verification
            const cscsResponse = await cscs.verifyCSCS(cscsNo);
            if (!cscsResponse) return next(new AppError('Error occured while verifying your CSCS number', 512));
            if (cscsResponse.ResponseCode != 200) return next(new AppError('CSCS Number not valid', 404));
            if (cscsResponse.error) return next(new AppError('Error occured while verifying your CSCS number', 512));
            data.cscs = cscsResponse.CscsNo;

            data.cscsVerified = false;
            customer = await Customer.create(data);
            let resp = {
                code: 200,
                status: 'success',
                message: 'customer signup successful',
                data: {
                    bvnData
                }
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;
        }
        // *** send onboarding message
        let opts = {
            email: customer.email,
            subject: 'Account created',
            message: `<p>Hello ${customer.firstName},</p>
            <p>Your account has been successfully created.</p>
            <p>Username: <b>${customer.email}</b></p>
            <p>Password: <b>${password}</b></p>
            <p>Kindly log in on the platform to change your password.</b></p>
            <p>Best Regards,</p>
            <p>Chapel Hill Denham</p>           `
        }
        sendEmail(opts).then(r => console.log('Onboarding email sent to customer: ' + customer.email)).catch(err => console.log('Error sending onboarding email to customer.', err))
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.newUploadKycDocuments = async (req, res, next) => {
    try {
        let userId = '';
        if (req.user.role === "customer") {
            userId = req.user.id;
        } else {
            userId = req.params.id;
        }

        const form = new formidable({multiples: true});
        let files = {};
        let fields = {};

        let document = {
            name: '',
            value: '',
            customerId: userId
        };

        form.on('file', (name, file) => {
            files[name] = file
        })
            .on('field', (name, field) => {
                fields[name] = field
            })
            .on('end', async () => {
                // console.log(fields, files);
                // check if user uploaded any document
                if (files.length === 0 || fields.length === 0) {
                    return next(new AppError('Please supply items for upload.', 400));
                }

                let resp = {
                    code: 200,
                    status: 'success',
                    message: 'KYC Documents Uploaded Successfully.'
                }

                res.status(resp.code).json(resp);

                // check if customer already exists in the data
                let customers = await KycDocuments.findAll({
                    where: {customerId: userId}
                });

                for (let field in fields) {
                    document.name = field;
                    document.value = fields[field];

                    let documentType = document.name.split(';');
                    // update value if data already exists for the customer
                    let item = customers.filter(c => c.name.split(';')[0] === documentType[0]);

                    if (item.length > 0) {
                        for (let val of item) {
                            await KycDocuments.update({name: document.name, value: document.value}, {
                                where: {
                                    [Op.and]: [{customerId: userId}, {name: val.name}]
                                }
                            });
                        }
                    } else {
                        // add new documents to documents array
                        await KycDocuments.create(document);
                    }
                }

                for (let key in files) {
                    let file = files[key].path;
                    let extName = path.extname(file);
                    let result = {};
                    if (extName === '.pdf') {
                        result = await cloudinary.uploadPdf(file);
                    } else {
                        result = await cloudinary.uploadImage(file);
                    }

                    if (result.secure_url) {
                        document.value = result.secure_url;
                        document.name = key;

                        let documentType = key.split(';');

                        // update value if data already exists for the customer
                        let item = customers.filter(c => c.name.split(';')[0] === documentType[0]);

                        if (item.length > 0) {
                            for (let val of item) {
                                await KycDocuments.update({name: document.name, value: document.value}, {
                                    where: {
                                        [Op.and]: [{customerId: userId}, {name: val.name}]
                                    }
                                });
                            }
                        } else {
                            // add new documents to documents array
                            await KycDocuments.create(document);
                        }
                    }
                }

                res.locals.resp = resp;
                return next();
            })
        form.parse(req);
    } catch (error) {
        return next(error);
    }
}

exports.createNextOfKin = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let {name, relationship, address, phoneNumber, email} = req.body;

        // check if user supplied the requested items
        let request = ['name', 'relationship', 'address', 'phoneNumber', 'email'];
        request.map(item => {
            if (!req.body[item]) return next(new AppError(`${item} is required`, 400));
        })

        let customer = {
            nextOfKinName: name,
            nextOfKinPhoneNumber: phoneNumber,
            nextOfKinRelationship: relationship,
            nextOfKinAddress: address,
            nextOfKinEmail: email
        };

        await Customer.update(customer, {where: {id: userId}});

        let resp = {
            code: 201,
            status: 'success',
            message: 'Next of Kin details created successfully',
            data: customer
        };

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        console.error('Create Next of Kin: ', error);
        return next(error);
    }
}

exports.editNextOfKin = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let {name, relationship, address, phoneNumber, email} = req.body;

        // check if user supplied the requested items
        let userRequest = Object.keys(req);
        let request = ['name', 'relationship', 'address', 'phoneNumber', 'email'];

        if (!(request.some(item => userRequest.includes(item)))) {
            return next(new AppError(`Ensure request contains at least one of these keys: 
                ${request[0]}, ${request[1]}, ${request[2]}, ${request[3]}, ${request[4]}`));
        }

        let customer = {
            nextOfKinName: name,
            nextOfKinPhoneNumber: phoneNumber,
            nextOfKinRelationship: relationship,
            nextOfKinAddress: address,
            nextOfKinEmail: email
        };

        await Customer.update(customer, {where: {id: userId}});

        let resp = {
            code: 204,
            status: 'success',
            message: 'Next of Kin details updated successfully',
            data: customer
        };

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();


    } catch (error) {
        console.error('Edit Next of Kin: ', error);
        return next(error);
    }
}

exports.getUploadedKycDocuments = async (req, res, next) => {
    try {
        let userId = '';
        if (req.user.role === "customer") {
            userId = req.user.id;
        } else {
            userId = req.params.id;
        }


        let documents = await KycDocuments.findAll({
            where: {customerId: userId},
            attributes: ['name', 'value']
        });

        let resp = {
            code: 200,
            status: 'success',
            message: 'KYC documents fetched successfully',
            data: documents
        };

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        console.error('Get Uploaded Kyc Documents: ', error);
        return next(error);
    }
}

exports.miniSignup = async (req, res, next) => {
    try {
        let {firstname, lastname, phonenumber, email, password} = req.body;

        // check if user supplied the requested items
        let request = ['firstname', 'lastname', 'email', 'password'];
        request.map(item => {
            if (!req.body[item]) return next(new AppError(`${item} is required`, 400));
        })

        let hashedPassword = bcrypt.hashSync(password, 12);
        let defaultDob = moment("01-01-1700").format("YYYY-MM-DD");

        let emailExists = await Customer.findOne({where: {email: email}});

        if (emailExists) {
            return next(new AppError('Email already exists for another customer.', 400));
        }

        let customer = await Customer.create(
            {
                firstName: firstname,
                lastName: lastname,
                email,
                password: hashedPassword,
                gender: 'other',
                dob: defaultDob,
                phone: phonenumber,
                address: 'Mini-SignUp',
            });

        let resp = {
            code: 201,
            status: 'success',
            message: 'customer created successfully',
            data: customer
        };

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();

    } catch (error) {
        console.error('Mini Signup: ', error);
        return next(error);
    }
}

exports.firstStepVerification = async (req, res, next) => {
    try {
        let {bvn, cscsNo, dob} = req.body;
        let bvnResponse = "";
        let cscsResponse = "";
        let bvnData = {};
        let response = {};
        let cscsVerification = {};

        // verify bvn passed
        if (bvn && (bvn == '' || isNaN(bvn))) {
            return next(new AppError('Please enter a valid bvn', 400));
        }

        if (bvn && (bvn.length < 11 || bvn.length > 11)) {
            return next(new AppError('BVN should be 11 digits', 400));
        }

        // verify cscs number
        if (cscsNo && (cscsNo == '' || isNaN(cscsNo))) {
            return next(new AppError('Please enter a valid cscsNo', 400));
        }

        // verify bvn
        if (bvn) {
            response = await verifyme.verifyBVN(bvn);
        }


        if (response?.status !== "success") {
            bvnResponse = response.message ? response.message : "BVN request failed with an unknown error";
        } else {
            let formattedDob = moment(dob, 'DD-MM-YYYY').format('DDMMYYYY');
            let formattedBvnDate = response.data.birthdate.replace(/-/g, '');

            if (formattedDob !== formattedBvnDate) {
                bvnResponse = 'Entered date of birth does not match BVN details';
            } else {
                const firstName = response.data.firstname ? response.data.firstname : "";
                const middleName = response.data.middlename ? response.data.middlename : "";
                const lastName = response.data.lastname ? response.data.lastname : "";
                bvnResponse = `${firstName} ${middleName} ${lastName}`;
                bvnData = response.data;
            }
        }


        // verify cscs
        if (cscsNo) {
            cscsVerification = await cscs.verifyCSCS(cscsNo);
        }


        if (cscsVerification?.ResponseCode != 200) {
            cscsResponse = 'CSCS Number is not valid';
        } else {
            const cscsAccountName = cscsVerification.AccountName ? cscsVerification.AccountName : "Account Name not found";
            cscsResponse = `${cscsAccountName}`;
        }

        let resp = {
            code: 200,
            status: 'success',
            message: 'Successful First Step Verification',
            data: {
                bvn,
                bvnResponse,
                bvnData,
                cscsNo,
                cscsResponse
            }
        };

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (err) {
        console.error('First Step Verification faile with Error: ', err);
        return next(err);
    }
}


