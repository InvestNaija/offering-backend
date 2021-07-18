const AppError = require('../config/appError');
const jwt = require('jsonwebtoken');
const db = require('../models/index');
const session = require('chd-session-mgt');

exports.createAccessToken = (signature) => {
    try {
        const token = jwt.sign(signature, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "24h"
        })
        
        return token;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.createResetToken = (signature) => {
    try {
        const token = jwt.sign(signature, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1h"
        })
        
        return token;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.customerAuth = (req, res, next) => {
    try {
        let auth = req.headers['authorization'];
        if(!auth) return next(new AppError('Please login to access the resource', 401));
        let resp = session.customerAuth(auth, process.env.ACCESS_TOKEN_SECRET);
        // console.log(resp)
        if(resp.id) {
            req.user = resp;
            next();
        }
        else return next(new AppError('You are unauthorized to access the resource', 401));
    } catch (error) {
        return next(error);
    }
}

exports.brokerAuth = (req, res, next) => {
    try {
        let auth = req.headers['authorization'];
        if(!auth) return next(new AppError('Please login to access the resource', 401));
        const authorized = jwt.verify(auth, process.env.ACCESS_TOKEN_SECRET);
        if(authorized.role === 'broker') {
            req.user = authorized;
            next();
        }
        else return next(new AppError('You are unauthorized to access the resource', 401));
    } catch (error) {
        return next(error);
    }
}

exports.adminAuth = (req, res, next) => {
    try {
        let auth = req.headers['authorization'];
        if(!auth) return next(new AppError('Please login to access the resource', 401));
        const authorized = jwt.verify(auth, process.env.ACCESS_TOKEN_SECRET);
        if(authorized.role === 'admin') {
            req.user = authorized;
            next();
        }
        else return next(new AppError('You are unauthorized to access the resource', 401));
    } catch (error) {
        return next(error);
    }
}

exports.userCheck = (req, res, next) => {
    try {
        let auth = req.headers['authorization'];
        if(!auth) return next(new AppError('Please login to access the resource', 401));
        const authorized = jwt.verify(auth, process.env.ACCESS_TOKEN_SECRET);
        if(authorized.role === "customer") {
            req.user = authorized;
            next();
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.brokerCheck = (req, res, next) => {
    try {
        let auth = req.headers['authorization'];
        if(!auth) return next(new AppError('Please login to access the resource', 401));
        const authorized = jwt.verify(auth, process.env.ACCESS_TOKEN_SECRET);
        if(authorized.role === "broker") {
            req.user = authorized;
            next();
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.brokerAndCustomerAuth = (req, res, next) => {
    try {
        let auth = req.headers['authorization'];
        if(!auth) return next(new AppError('Please login to access the resource', 401));
        const authorized = jwt.verify(auth, process.env.ACCESS_TOKEN_SECRET);
        if(authorized.role === "broker" || authorized.role === "customer") {
            req.user = authorized;
            next();
        }
        else return next(new AppError('You are unauthorized to access the resource', 401));
    } catch (error) {
        return next(error);
    }
}

exports.mtnAuth = (req, res, next) => {
    try {
        let auth = req.headers['authorization'];
        if(!auth) return next(new AppError('Unauthorised request.', 401));
        if(auth === process.env.MTN_SECRET) {
            next();
        }
        else return next(new AppError('You are unauthorized to access the resource', 401));
    } catch (error) {
        return next(error);
    }
}

exports.momoAuth = (req, res, next) => {
    try {
        let auth = req.headers['authorization'];
        if(!auth) return next(new AppError('Unauthorised request.', 401));
        if(auth === process.env.MOMO_SECRET) {
            next();
        }
        else return next(new AppError('You are unauthorized to access the resource', 401));
    } catch (error) {
        return next(error);
    }
}

exports.saveAndPlanAuth = (req, res, next) => {
    try {
        let secret = req.headers['api-secret'];
        if(!secret) return next(new AppError('Unauthorised request.', 401));
        if(secret === process.env.SAVE_AND_PLAN_KEY) return next();
        else return next(new AppError('You are unauthorized to access the resource', 401));
    } catch (error) {
        return next(error);
    }
}