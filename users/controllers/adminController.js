const db = require('../../models/index');
const AppError = require('../../config/appError');
const bcrypt = require('bcryptjs');
const auth = require('../../auth/authController');
const Admin = db.admins;
const cloudinary = require('../../config/cloudinary');

exports.signup = async(req, res, next) => {
    try {
        let {email, password} = req.body;
        if(!email || !password) return next(new AppError('email and password required', 400));
        const emailExists = await Admin.findOne({where: {email}});
        if(emailExists) return next(new AppError('A user is already signed up with this email', 409));
        let hash = bcrypt.hashSync(password, 12);
        const admin = await Admin.create({email, password: hash});
        let resp = {
            code: 201,
            status: 'success',
            data: admin,
            message: 'Signup success'
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