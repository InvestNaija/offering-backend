const axios = require('axios').default;
const AppError = require('./appError');
require('dotenv').config();

const getHeaders = {
    'Authorization': `Bearer ${process.env.VERIFYME_KEY}`
};

const postHeaders = {
    'Authorization': `Bearer ${process.env.VERIFYME_KEY}`,
    'Content-Type': 'application/json'
};


exports.verifyNIN = async(nin, firstname, lastname) => {
    try {
        let body = {
            firstname,
            lastname
        }
        const response = await axios.request({
            url: `https://vapi.verifyme.ng/v1/verifications/identities/nin/${nin}`,
            method: 'POST',
            headers: postHeaders,
            data: JSON.stringify(body)
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.verifyBVN = async (bvn, firstname, lastname) => {
    try {
        if(!firstname) {
            firstname = 'firstname';
        }

        if(!lastname) {
            lastname = 'lastname';
        }

        const url = `${process.env.VERIFYME_BVN_ENDPOINT}/${bvn}`

        let body = {
            firstname,
            lastname
        };

        const response = await axios.request({
            url,
            method: 'POST',
            headers: postHeaders,
            data: JSON.stringify(body)
        });

        return response.data;
    }
    catch (error) {
        console.error(error);
        return;
    }
}
