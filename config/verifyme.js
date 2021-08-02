const axios = require('axios').default;
const AppError = require('./appError');
require('dotenv').config();
const db = require('../models/index');
const BvnData = db.bvnData;

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
        const bvnExists = await BvnData.findOne({where: {bvn}});

        let res = {};

        if (bvnExists) {
           let bvndata = {
               bvn,
               firstname: bvnExists.firstName,
               middlename: bvnExists.middleName,
               lastname: bvnExists.lastName,
               email,
               phone: bvnExists.phoneNumber,
               image,
               birthdate: bvnExists.dateOfBirth
           };

           res.data = bvndata;

           return res;
        }
        
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

        // data to save the the database.
        let newBvn = {
            bvn,
            firstName: response.data.data.firstname,
            middleName: response.data.data.middlename,
            lastName: response.data.data.lastname,
            email: response.data.data.email,
            phoneNumber: response.data.data.phone,
            dateOfBirth: response.data.data.birthdate,
            image: response.data.data.image
        };

        // save bvn data to database
        const bvnCreated = await BvnData.create(newBvn);

        if (!bvnCreated) {
            console.error('Failed to store BVN data');
        }

        res = response.data;
        return res;
    }
    catch (error) {
        console.error(error);
        return;
    }
}
