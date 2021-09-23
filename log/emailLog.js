const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
    emailFrom: String,
    emailTo: String,
    subject: String,
    status: String,
    successMessage: String,
    errorMessage: String
}, {
    timestamps: true
})

module.exports = mongoose.model('emailLog', emailLogSchema);