const axios = require('axios').default;
const AppError = require('./appError');
const helper = require('./helper');

const getHeaders = {
    'Authorization': `Bearer ${process.env.FLUTTERWAVE_LIVE}`
};

const postHeaders = {
    'Authorization': `Bearer ${process.env.FLUTTERWAVE_LIVE}`,
    'Content-Type': 'application/json'
};

exports.intitializeTransaction = async(user, amount, callback_url, tx_ref) => {
    try {
        let data = {amount, redirect_url: callback_url, payment_options: 'card', currency: "NGN", tx_ref}
        data.customer = {
            email: user.email,
            phonenumber: user.phone,
            name: user.firstName + ' ' + user.lastName
        }
        data.customizations = {
            title: "Invest Naija Funding",
            description: "Invest Naija Funding",
            logo: ""
        }
        let payload = JSON.stringify(data);
        const response = await axios.request({
            url: 'https://api.flutterwave.com/v3/payments',
            method: 'POST',
            headers: postHeaders,
            data: payload
        })
        return response.data;
    } catch (error) {
        console.error(error)
        return new AppError(error.message, error.response.status || 500);
    }
}



exports.initializeDollarTransaction = async (user, amount, redirect_url, tx_ref, subaccountId) => {
    try {
        let data = {
            amount,
            redirect_url,
            payment_options: 'card',
            currency: "USD",
            tx_ref
        };

        data.customer = {
            email: user.email,
            phonenumber: user.phone,
            name: user.firstName + ' ' + user.lastName
        };

//         data.customizations = {
//             title: "Invest Naija Funding",
//             description: "Invest Naija Funding",
//             logo: ""
//         };

        // pass sub account id if sub account is defined
        if (subaccountId) {
            data.subaccounts = [{
                id: subaccountId,
            }]
        }


        const payload = JSON.stringify(data);
        const response = await axios.request({
            url: 'https://api.flutterwave.com/v3/payments',
            method: 'POST',
            headers: postHeaders,
            data: payload
        });

        return response.data;
    } catch (error) {
        console.error(error);
        return new AppError(error.message, error.response.status || 500);
    }
}

exports.verifyTransaction = async(ref) => {
    try {
        const response = await axios.request({
            url: `https://api.flutterwave.com/v3/transactions/${ref}/verify`,
            method: 'GET',
            headers: getHeaders
        })
        return response.data.data;
    } catch (error) {
        return new AppError(error.response.data.message, error.response.status);
    }
}

exports.listBanks = async() => {
    try {
        const response = await axios.request({
            url: 'https://api.flutterwave.com/v3/banks/NG',
            method: 'GET',
            headers: getHeaders
        })
        return response.data;
    } catch (error) {
        return new AppError(error.response.data.message, error.response.status);
    }
}

exports.verifyAccount = async(nuban, code) => {
    try {
        let data = {
            account_number: nuban,
            account_bank: code
        }
        let payload = JSON.stringify(data);
        const response = await axios.request({
            url: `https://api.flutterwave.com/v3/accounts/resolve`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.FLUTTERWAVE_LIVE}`,
                'Content-Type': 'application/json'
            },
            data: payload
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return new AppError(error.response.data.message, error.response.status);
    }
}

exports.createRecipient = async(user) => {
    try {
        let data = JSON.stringify(user)
        const response = await axios.request({
            url: `https://api.flutterwave.com/v3/beneficiaries`,
            method: 'POST',
            headers: postHeaders,
            data
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return new AppError(error.response.data.message, error.response.status);
    }
}

exports.deleteRecipient = async(recipient_code) => {
    try {
        const response = await axios.request({
            url: `https://api.flutterwave.com/v3/beneficiaries/${recipient_code}`,
            method: 'DELETE',
            headers: getHeaders
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return new AppError(error.response.data.message, error.response.status);
    }
}

exports.verifyBVN = async(bvn) => {
    try {
        const response = await axios.request({
            url: `https://api.flutterwave.com/v3/kyc/bvns/${bvn}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.FLUTTERWAVE_LIVE}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return new AppError(error.response.data.message, error.response.status);
    }
}

exports.initializeWithdrawal = async(data) => {
    try {
        let post = JSON.stringify(data)
        const response = await axios.request({
            url: `https://api.flutterwave.com/v3/transfers`,
            method: 'POST',
            headers: postHeaders,
            data: post
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return new AppError(error.response.data.message, error.response.status);
    }
}
