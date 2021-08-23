const axios = require('axios').default;
const AppError = require('./appError');
require('dotenv').config();
const db = require('../models/index');
const BvnData = db.bvnData;
const Customer = db.customers;
const Admin = db.admins;
const { Op } = require('sequelize');
const moment = require("moment");
const { empty } = require('uuidv4');

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
               email: bvnExists.email,
               phone: bvnExists.phoneNumber,
               image: bvnExists.image,
               birthdate: moment(bvnExists.dateOfBirth).format('DD-MM-YYYY'),
               maritalStatus: bvnExists.maritalStatus,
               lgaOfResidence: bvnExists.lgaOfResidence,
               lgaOfOrigin: bvnExists.lgaOfOrigin,
               residentialAddress: bvnExists.residentialAddress,
               stateOfOrigin: bvnExists.stateOfOrigin,
               enrollmentBank: bvnExists.enrollmentBank,
               enrollmentBranch: bvnExists.enrollmentBranch,
               nameOnCard: bvnExists.nameOnCard,
               title: bvnExists.title,
               levelOfAccount: bvnExists.levelOfAccount
           };

           res.data = bvndata;
           res.status = 'success';

           return res;
        }
        
        if(!firstname) {
            firstname = 'firstname';
        }

        if(!lastname) {
            lastname = 'lastname';
        }

        const url = `${process.env.VERIFYME_BVN_ENDPOINT}/${bvn}?type=premium`

        let body = {
            firstname,
            lastname
        };

        const response = await axios.request({
            url,
            method: 'POST',
            headers: postHeaders,
            timeout: 6000,
            data: JSON.stringify(body)
        });

        if (response.status == 201) {
            const customer = await Customer.findOne({
                where: {
                    email: response.data.data.email
                }
            });

            const admin = await Admin.findOne({
                where: {
                    email: response.data.data.email
                }
            });

            // data to save the the database.
            let newBvn = {
                bvn,
                firstName: response.data.data.firstname,
                middleName: response.data.data.middlename,
                lastName: response.data.data.lastname,
                email: response.data.data.email,
                phoneNumber: response.data.data.phone,
                dateOfBirth: moment(response.data.data.birthdate, 'DD-MM-YYYY').format('YYYY-MM-DD hh:mm:ss'),
                image: response.data.data.photo,
                maritalStatus: response.data.data.maritalStatus,
                lgaOfResidence: response.data.data.lgaOfResidence,
                lgaOfOrigin: response.data.data.lgaOfOrigin,
                residentialAddress: response.data.data.residentialAddress,
                stateOfOrigin: response.data.data.stateOfOrigin,
                enrollmentBank: response.data.data.enrollmentBank,
                enrollmentBranch: response.data.data.enrollmentBranch,
                nameOnCard: response.data.data.nameOnCard,
                title: response.data.data.title,
                levelOfAccount: response.data.data.levelOfAccount,
                customerId: customer ? customer.id : empty(),
                adminId: admin ? admin.id : empty()
            };


            // save bvn data to database
            const bvnCreated = await BvnData.create(newBvn);

            if (!bvnCreated) {
                console.error('Failed to store BVN data');
            }
        }

        res = response.data;
        return res;
    }
    catch (error) {
        console.error(error);
        return;
    }
}
