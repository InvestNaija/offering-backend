const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    
    ip: String,

    requestBody: String,

    responseBody: String,

    responseMessage: String,

    responseCode: String,

    endpoint: String,

}, {
    timestamps: true
});

module.exports = mongoose.model('log', logSchema);