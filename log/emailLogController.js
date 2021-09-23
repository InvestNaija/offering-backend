const EmailLog = require('./emailLog');

exports.logEmail = async (data) => {
    try {
        let emailData = {};
        emailData.emailFrom = data.emailFrom;
        emailData.emailTo = data.emailTo;
        emailData.subject = data.subject;
        emailData.status = 'pending';
        emailData.successMessage = null;
        emailData.errorMessage = null;

        const log = await EmailLog.create(emailData);
    } catch (error) {
        console.error('Log Email: ', error);
    }
}