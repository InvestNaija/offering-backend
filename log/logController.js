const Log = require('./log');

exports.logRequest = async(req, res, next) => {
    try {
        let data = {};
        data.ip = req.ip;
        if(req.body) data.requestBody = JSON.stringify(req.body);
        data.endpoint = req.originalUrl;
        data.createtype = 'request';
        const log = await Log.create(data);
        req.log = log;
        console.log('request logged');
        return next();
    } catch (error) {
        console.error(error);
    }
}

exports.logResponse = async(req, res, next) => {
    try {
        let resp = res.locals.resp;
        const log = await Log.findById(req.log.id);
        if(!log) {
            console.log('Log not found');
            return;
        }
        if(!resp) return next();
        let data = {};
        data.responseCode = resp.code;
        if(resp.data) data.responseBody = JSON.stringify(resp.data);
        if(resp.message) data.responseMessage = resp.message;
        await log.updateOne(data);
        console.log('response logged');
    } catch (error) {
        console.log(error);
    }
}
