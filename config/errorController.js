const log = require('../log/logController');

module.exports = async(err, req, res, next)=>{
    
    console.error(err.name, err.message, err.stack);
    res.locals.resp = {
        code: err.statusCode || 500,
        message: err.message
    }

    if(process.env.NODE_ENV === 'development') {
        res.status(err.statusCode || 500).json({
            error: {
                title: err.name,
                message: err.message
            }
        });
    } else if (process.env.NODE_ENV === 'production') {
        if(err.isOperational) {
            res.status(err.statusCode).json({
                error: {
                    message: err.message
                }
            })
        } 
        
        else if(err.name === 'ValidationError'){
            res.status(406).json({
                error: {
                    title: err.name,
                    message: err.message
                }
            })
        }
    
        else if(err.name === 'JsonWebTokenError'){
            res.status(401).json({
                error: {
                    title: err.name,
                    message: err.message
                }
            })
        }
    
        else if(err.name === 'TokenExpiredError'){
            res.status(411).json({
                error: {
                    title: err.name,
                    message: err.message
                }
            })
        }
    
        else if(err.code === 11000){
            const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
            res.status(409).json({
                error: {
                    title: 'Duplicate Field Error',
                    message: `Duplicate field value: ${value}. Please enter another value and Try again`
                }
            })
        }
        
        else {
            res.status(err.statusCode || 500).json({
                error: {
                    message: "Something went wrong in the server"
                }
            })
        }
    }
    await log.logResponse(req, res);
}