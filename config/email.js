const nodemailer = require('nodemailer');
const log = require('../log/logController');

const sendEmail = async options => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: `${process.env.EMAIL_HOST}`,
        port: `${process.env.EMAIL_PORT}`,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: `Chapel Hill Denham <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        replyTo: options.replyTo,
        // text: options.message
        html: options.message
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
    log.logRequest(req)
};

module.exports = sendEmail;