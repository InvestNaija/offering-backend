const db = require('../../models/index');
const AppError = require('../../config/appError');
const bcrypt = require('bcryptjs');
const auth = require('../../auth/authController');
const Broker = db.brokers;
const _ = require('underscore');
const helper = require('../../config/helper');
const Wallet = db.wallets;
const Token = db.tokens;
const {sendEmail} = require('../../config/email');

exports.create = async(req, res, next) => {
    try {
        let request = ['name', 'email', 'phone', 'address'];
        request.map(item => {
            if(!req.body[item]) return next(new AppError(`${item} is required`, 400));
        })
        request.push('type');
        let data = _.pick(req.body, request);
        const emailExists = await Broker.findOne({where: {email: data.email}});
        if(emailExists) return next(new AppError('A user is already signed up with this email', 409));
        let password = helper.generateOTCode(8, true);
        data.password = bcrypt.hashSync(password, 12);
        const broker = await Broker.create(data);
        await Wallet.create({brokerId: broker.id});
        let resp = {
            code: 201,
            status: 'success',
            data: broker,
            message: 'Broker created'
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        
        let opts = {
            email: broker.email,
            subject: 'Account created',
            message: `<p>Hello ${broker.name},</p>
            <p>Your account has been successfully created.</p>
            <p>Username: <b>${broker.email}</b></p>
            <p>Password: <b>${password}</b></p>
            <p>Kindly log in on the platform to change your password.</b></p>
            <p>Best Regards,</p>
            <p>The Invest Naija Team.</p>
            `
        }
        sendEmail(opts).then(r => console.log('Onboarding email sent to broker: ' + broker.email)).catch(err => console.log('Error sending onboarding email to broker.', err))
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.login = async(req, res, next) => {
    try {
        let {email, password} = req.body;
        if(!email || !password) return next(new AppError('email and password required', 400));
        const user = await Broker.findOne({where: {email}});
        if(!user) return next(new AppError('User not found', 404));
        const correctPassword = bcrypt.compareSync(password, user.password);
        if(!correctPassword) return next(new AppError('Wrong password entered', 406));
        let signature = {
            id: user.id,
            role: user.role,
            type: user.type
        }
        const token = auth.createAccessToken(signature);
        let resp = {
            code: 200,
            status: 'success',
            data: user,
            message: 'broker login success',
            token
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.changePassword = async(req, res, next) => {
    try {
        let brokerId = req.user.id
        let {oldPassword, newPassword} = req.body;
        if(!oldPassword || !newPassword) return next( new AppError('New and old passwords required', 406));
        const broker = await Broker.findByPk(brokerId);
        const correctPassword = bcrypt.compareSync(oldPassword, broker.password);
        if(!correctPassword) return next(new AppError('Incorrect old password entered', 401));
        let hash = bcrypt.hashSync(newPassword, 12);
        await Broker.update({password: hash, passwordUpdated: true}, {where: {id: broker.id}});
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

exports.forgotPasswordBroker = async(req, res, next) => {
    try {
        let {email} = req.body;
        const user = await Broker.findOne({where: {email}});
        if(!user) return next(new AppError('user not found.', 404));
        let str = crypto.randomBytes(16).toString("hex");
        const token = await Token.create({token: str, brokerId: user.id});
        if(!token) return next(new AppError('error creating password reset', 500));
        let url = `http://chapelhill.flexi.ng/auth/broker-reset-password?token-details=${token.token}`;
        let opts = {
            email: user.email,
            subject: 'Password Reset',
            message: `<p>Hello ${user.name},</p>
            <p>Follow this link to reset your account's password:</p>
            <p><a href="${url}">Reset</a></p>
            `
        }
        sendEmail(opts).then(r=>{
            console.log('password reset email sent');
            let resp = {
                code: 200,
                status: 'success',
                message: 'Password reset email sent. Please check your mail.'
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;
            return next();
        }).catch(err=>{
            console.log('error sending password reset', err);
            return next(new AppError('Error sending password reset email. Please try again.', 500));
        })
    } catch (error) {
        return next(error);
    }
}

exports.resetPassword = async(req, res, next) => {
    try {
        let token = req.params.token;
        if(!token) return next(new AppError('token is required', 400));
        let {password, confirmPassword} = req.body;
        if(!password || !confirmPassword) return next(new AppError('password and confirmPassword is required', 400));
        if(password !== confirmPassword) return next(new AppError('password and confirmPassword do not match', 400));
        const tokenExists = await Token.findOne({where: {token}});
        if(!tokenExists || tokenExists.used) return next(new AppError('invalid or expired token', 401));
        let brokerId = tokenExists.brokerId;
        if(!brokerId) return next(new AppError('invalid broker', 401));
        let hash = bcrypt.hashSync(password, 12);
        await Customer.update({password: hash}, {where: {id: brokerId}});
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

exports.edit = async(req, res, next) => {
    try {
        let brokerId = req.params.id;
        let request = ['name', 'email', 'phone'];
        let data = _.pick(req.body, request);
        await Broker.update(data, {where: {id: brokerId}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'Broker profile successfully updated.'
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getAll = async(req, res, next) => {
    try {
        let brokers = await Broker.findAll();
        let resp = {
            code: 200,
            status: 'success',
            message: 'all brokers fetched.',
            data: brokers
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getNormalCount = async(req, res, next) => {
    try {
        const count = await Broker.count({where: {type: 'normal'}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'brokers count fetched.',
            count
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getMTNCount = async(req, res, next) => {
    try {
        const count = await Broker.count({where: {type: 'mtn'}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'momo agents count fetched.',
            count
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.fetch = async(req, res, next) => {
    try {
        let brokerId = req.params.id;
        const broker = await Broker.findByPk(brokerId);
        let resp = {
            code: 200,
            status: 'success',
            message: 'broker fetched.',
            data: broker
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

// exports.createCustomer = async(req, res, next) => {
//     try {
//         let brokerId = req.user.id;
//         let data = _.pick(req.body, ['firstName', 'lastName', 'middleName', 'address','email', 'phone', 'password', 'gender', 'dob', 'bvn']);
//         data.dob = new Date(data.dob);
//         data.password = bcrypt.hashSync(data.password, 12);
//         data.brokerId = brokerId;
//         data.type = 'broker';
//         const customer = await customer.create({data});
//         res.status(201).json({
//             status: 'success',
//             data: customer
//         })

//         // ****** notification with otp sent to customer
//         let otp = helper.generateOTCode(6, false);
//         const token = await Token.create({token: otp, customerId: customer.id});
//         let opts = {
//             from: 'Invest Naija <hello@9id.com.ng>',
//             email: customer.email,
//             subject: 'Verify Your Account',
//             message: `<p>Hello ${customer.firstName},</p>
//             <p>Please enter this code to verify your account.</p>
//             <p><b>${token.token}</b></p>
//             <p>Best Regards,</p>
//             <p>The Invest Naija Team.</p>
//             `
//         }
//         sendEmail(opts).then(r=>console.log('OTP email sent to customer: ' + customer.email)).catch(err=>console.log('error sending otp email', err))

//         // *** Register customer on zannibal and update id on profile
//     } catch (error) {
//         return next(error);
//     }
// }