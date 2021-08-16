const nodemailer = require('nodemailer');
const fs = require("fs");
const handlebars = require('handlebars');

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
};

const sendEmailWithTemplates = async (templateName, replacements, options) => {
    // create transporter
    const transporter = nodemailer.createTransport({
        host: `${process.env.EMAIL_HOST}`,
        port: `${process.env.EMAIL_PORT}`,
        secure: true,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    let path = __dirname + 'public/emailTemplates/' + templateName + '.html';
    path = path.replace("config", "");


    let html = fs.readFileSync(path, "utf-8");
    let template = handlebars.compile(html);
    let htmlToSend = template(replacements);
    let mailOptions = {
        from: `Chapel Hill Denham <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        replyTo: options.replyTo,
        html: htmlToSend
    };

    await transporter.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log('Error Sending Email with Template: ', error);
            throw error;
        }
    });
}

module.exports = {sendEmail, sendEmailWithTemplates};