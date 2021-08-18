const db = require('../../models/index');
const AppError = require('../../config/appError');
const bcrypt = require('bcryptjs');
const auth = require('../../auth/authController');
const Admin = db.admins;
const cloudinary = require('../../config/cloudinary');
const crypto = require("crypto");
const {sendEmail} = require("../../config/email");
const Token = db.tokens;

exports.signup = async(req, res, next) => {
    try {
        let createdBy = req.user.id;
        let {email, password, firstname, lastname} = req.body;
        if(!firstname) {
            return next(new AppError('firstname is required', 400));
        }

        if (!lastname) {
            return next(new AppError('lastname is required', 400));
        }

        if(!email || !password) return next(new AppError('email and password required', 400));

        const emailExists = await Admin.findOne({where: {email}});
        if(emailExists) return next(new AppError('A user is already signed up with this email', 409));
        let hash = bcrypt.hashSync(password, 12);
        const admin = await Admin.create({firstName: firstname, lastName: lastname, email, password: hash, createdBy});

        let resp = {
            code: 201,
            status: 'success',
            message: 'Created admin successfully',
            data: admin,
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.login = async(req, res, next) => {
    try {
        let {email, password} = req.body;
        if(!email || !password) return next(new AppError('email and password required', 400));
        const user = await Admin.findOne({where: {email}});
        if(!user) return next(new AppError('User not found', 404));
        const correctPassword = bcrypt.compareSync(password, user.password);
        if(!correctPassword) return next(new AppError('Wrong password entered', 406));
        let signature = {
            id: user.id,
            role: user.role
        }
        const token = auth.createAccessToken(signature);
        let resp = {
            code: 200,
            status: 'success',
            data: user,
            message: 'login success',
            token
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.update = async(req, res, next) => {
    try {
        let id = req.query.id;
        if(!id) return next(new AppError('id required', 400));
        let {firstName, lastName, phone, country, dob, image} = req.body;
        dob = new Date(dob);
        let update = {firstName, lastName, phone, country, dob};
        await Admin.update(update, {where: {id}})
        res.status(200).json({
            status: 'success',
            message: 'Profile updated'
        })
        if(image) {
            let response = await cloudinary.uploadImage(image);
            if(response) await Admin.update({image: response.secure_url}, {id});
            console.log('image updated');
        }
    } catch (error) {
        return next(error);
    }
}

exports.fetch = async(req, res, next) => {
    try {
        let {id} = req.query;
        if(!id) return next(new AppError('id required', 400));
        const admin = await Admin.findByPk(id);
        if(!admin) return next(new AppError('admin not found', 404));
        res.status(200).json({
            status: 'success',
            data: admin
        })
    } catch (error) {
        return next(error);
    }
}

exports.forgotPassword = async (req, res, next) => {
    try {
        let {email, baseUrl} = req.body;
        let url = "";
        const admin = await Admin.findOne({where: {email}});
        if (!admin) return next(new AppError('Admin not found.', 404));
        let tokenStr = crypto.randomBytes(16).toString("hex");
        const token = await Token.create({token: tokenStr, adminId: admin.id});
        if (!token) return next(new AppError('error creating password reset', 500));

        if (baseUrl) {
            url = `${baseUrl}/auth/reset-password?token-details=${token.token}`;
        } else {
            url = `${process.env.FRONTEND_URL}/auth/reset-password?token-details=${token.token}`;
        }

        let opts = {
            email: admin.email,
            subject: 'Password Reset',
            message: `<p>Hello ${admin.firstName} ${admin.lastName ? admin.lastName : ""},</p>
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
    } catch (err) {
        return next(err);
    }
}

exports.resetPassword = async (req, res, next) => {
    try {
        let token = req.params.token;
        if (!token) return next(new AppError('token is required', 400));
        let {password, confirmPassword} = req.body;
        if (!password || !confirmPassword) return next(new AppError('password and confirmPassword is required', 400));
        if (password !== confirmPassword) return next(new AppError('password and confirmPassword do not match', 400));
        const tokenExists = await Token.findOne({where: {token}});
        if (!tokenExists || tokenExists.used) return next(new AppError('invalid or expired token', 401));
        let adminId = tokenExists.adminId;
        if (!adminId) return next(new AppError('invalid customer', 401));
        let hash = bcrypt.hashSync(password, 12);
        await Admin.update({password: hash}, {where: {id: adminId}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'Password reset successful.'
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (err) {
        return next(err);
    }
}

exports.changePassword = async (req, res, next) => {
    try {
        let id = req.user.id
        let {oldPassword, newPassword} = req.body;
        if (!oldPassword || !newPassword) return next(new AppError('New and old passwords required', 406));
        const admin = await Admin.findByPk(id);
        const confirmedPassword = bcrypt.compareSync(oldPassword, admin.password);
        if (!confirmedPassword) return next(new AppError('Incorrect old password entered', 401));
        let hash = bcrypt.hashSync(newPassword, 12);
        await Admin.update({password: hash}, {where: {id}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'broker Password updated'
        }
        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (err) {
        console.error('ChangePassword Error: ', err);
        return next(err);
    }
}