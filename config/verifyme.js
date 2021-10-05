const axios = require('axios').default;
const AppError = require('./appError');
require('dotenv').config();
const db = require('../models/index');
const BvnData = db.bvnData;
const Customer = db.customers;
const Admin = db.admins;
const {Op} = require('sequelize');
const moment = require("moment");
const {empty} = require('uuidv4');

const getHeaders = {
    'Authorization': `Bearer ${process.env.VERIFYME_KEY}`
};

const postHeaders = {
    'Authorization': `Bearer ${process.env.VERIFYME_KEY}`,
    'Content-Type': 'application/json'
};


exports.verifyNIN = async (nin, firstname, lastname) => {
    try {
        let body = {
            firstname,
            lastname
        }
        const response = await axios.request({
            url: `https://vapi.verifyme.ng/v1/verifications/identities/nin/${nin}`,
            method: 'POST',
            headers: postHeaders,
            timeout: 1500,
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

        const banks = [
            {
                "name": "Abbey Mortgage Bank",
                "slug": "abbey-mortgage-bank",
                "code": "801",
                "active": true
            },
            {
                "name": "Access Bank",
                "slug": "access-bank",
                "code": "044",
                "active": true
            },
            {
                "name": "Access Bank (Diamond)",
                "slug": "access-bank-diamond",
                "code": "063",
                "active": true
            },
            {
                "name": "ALAT by WEMA",
                "slug": "alat-by-wema",
                "code": "035A",
                "active": true
            },
            {
                "name": "Amju Unique MFB",
                "slug": "amju-unique-mfb",
                "code": "50926",
                "active": true
            },
            {
                "name": "ASO Savings and Loans",
                "slug": "asosavings",
                "code": "401",
                "active": true
            },
            {
                "name": "Bainescredit MFB",
                "slug": "bainescredit-mfb",
                "code": "51229",
                "active": true
            },
            {
                "name": "Bowen Microfinance Bank",
                "slug": "bowen-microfinance-bank",
                "code": "50931",
                "active": true
            },
            {
                "name": "Carbon",
                "slug": "carbon",
                "code": "565",
                "active": true
            },
            {
                "name": "CEMCS Microfinance Bank",
                "slug": "cemcs-microfinance-bank",
                "code": "50823",
                "active": true
            },
            {
                "name": "Citibank Nigeria",
                "slug": "citibank-nigeria",
                "code": "023",
                "active": true
            },
            {
                "name": "Coronation Merchant Bank",
                "slug": "coronation-merchant-bank",
                "code": "559",
                "active": true
            },
            {
                "name": "Ecobank Nigeria",
                "slug": "ecobank-nigeria",
                "code": "050",
                "active": true
            },
            {
                "name": "Ekondo Microfinance Bank",
                "slug": "ekondo-microfinance-bank",
                "code": "562",
                "active": true
            },
            {
                "name": "Eyowo",
                "slug": "eyowo",
                "code": "50126",
                "active": true
            },
            {
                "name": "Fidelity Bank",
                "slug": "fidelity-bank",
                "code": "070",
                "active": true
            },
            {
                "name": "Firmus MFB",
                "slug": "firmus-mfb",
                "code": "51314",
                "active": true
            },
            {
                "name": "First Bank of Nigeria",
                "slug": "first-bank-of-nigeria",
                "code": "011",
                "active": true
            },
            {
                "name": "First City Monument Bank",
                "slug": "first-city-monument-bank",
                "code": "214",
                "active": true
            },
            {
                "name": "FSDH Merchant Bank Limited",
                "slug": "fsdh-merchant-bank-limited",
                "code": "501",
                "active": true
            },
            {
                "name": "Globus Bank",
                "slug": "globus-bank",
                "code": "00103",
                "active": true
            },
            {
                "name": "GoMoney",
                "slug": "gomoney",
                "code": "232",
                "active": true
            },
            {
                "name": "Guaranty Trust Bank",
                "slug": "guaranty-trust-bank",
                "code": "058",
                "active": true
            },
            {
                "name": "Hackman Microfinance Bank",
                "slug": "hackman-microfinance-bank",
                "code": "51251",
                "active": true
            },
            {
                "name": "Hasal Microfinance Bank",
                "slug": "hasal-microfinance-bank",
                "code": "50383",
                "active": true
            },
            {
                "name": "Heritage Bank",
                "slug": "heritage-bank",
                "code": "030",
                "active": true
            },
            {
                "name": "Ibile Microfinance Bank",
                "slug": "ibile-mfb",
                "code": "51244",
                "active": true
            },
            {
                "name": "Infinity MFB",
                "slug": "infinity-mfb",
                "code": "50457",
                "active": true
            },
            {
                "name": "Jaiz Bank",
                "slug": "jaiz-bank",
                "code": "301",
                "active": true
            },
            {
                "name": "Keystone Bank",
                "slug": "keystone-bank",
                "code": "082",
                "active": true
            },
            {
                "name": "Kuda Bank",
                "slug": "kuda-bank",
                "code": "50211",
                "active": true
            },
            {
                "name": "Lagos Building Investment Company Plc.",
                "slug": "lbic-plc",
                "code": "90052",
                "active": true
            },
            {
                "name": "Links MFB",
                "slug": "links-mfb",
                "code": "50549",
                "active": true
            },
            {
                "name": "Mayfair MFB",
                "slug": "mayfair-mfb",
                "code": "50563",
                "active": true
            },
            {
                "name": "Mint MFB",
                "slug": "mint-mfb",
                "code": "50304",
                "active": true
            },
            {
                "name": "PalmPay",
                "slug": "palmpay",
                "code": "999991",
                "active": true
            },
            {
                "name": "Parallex Bank",
                "slug": "parallex-bank",
                "code": "526",
                "active": true
            },
            {
                "name": "Parkway - ReadyCash",
                "slug": "parkway-ready-cash",
                "code": "311",
                "active": true
            },
            {
                "name": "Paycom",
                "slug": "paycom",
                "code": "999992",
                "active": true
            },
            {
                "name": "Petra Mircofinance Bank Plc",
                "slug": "petra-microfinance-bank-plc",
                "code": "50746",
                "active": true
            },
            {
                "name": "Polaris Bank",
                "slug": "polaris-bank",
                "code": "076",
                "active": true
            },
            {
                "name": "Providus Bank",
                "slug": "providus-bank",
                "code": "101",
                "active": true
            },
            {
                "name": "Rand Merchant Bank",
                "slug": "rand-merchant-bank",
                "code": "502",
                "active": true
            },
            {
                "name": "Rubies MFB",
                "slug": "rubies-mfb",
                "code": "125",
                "active": true
            },
            {
                "name": "Sparkle Microfinance Bank",
                "slug": "sparkle-microfinance-bank",
                "code": "51310",
                "active": true
            },
            {
                "name": "Stanbic IBTC Bank",
                "slug": "stanbic-ibtc-bank",
                "code": "221",
                "active": true
            },
            {
                "name": "Standard Chartered Bank",
                "slug": "standard-chartered-bank",
                "code": "068",
                "active": true
            },
            {
                "name": "Sterling Bank",
                "slug": "sterling-bank",
                "code": "232",
                "active": true
            },
            {
                "name": "Suntrust Bank",
                "slug": "suntrust-bank",
                "code": "100",
                "active": true
            },
            {
                "name": "TAJ Bank",
                "slug": "taj-bank",
                "code": "302",
                "active": true
            },
            {
                "name": "TCF MFB",
                "slug": "tcf-mfb",
                "code": "51211",
                "active": true
            },
            {
                "name": "Titan Bank",
                "slug": "titan-bank",
                "code": "102",
                "active": true
            },
            {
                "name": "Union Bank of Nigeria",
                "slug": "union-bank-of-nigeria",
                "code": "032",
                "active": true
            },
            {
                "name": "United Bank For Africa",
                "slug": "united-bank-for-africa",
                "code": "033",
                "active": true
            },
            {
                "name": "Unity Bank",
                "slug": "unity-bank",
                "code": "215",
                "active": true
            },
            {
                "name": "VFD Microfinance Bank Limited",
                "slug": "vfd",
                "code": "566",
                "active": true
            },
            {
                "name": "Wema Bank",
                "slug": "wema-bank",
                "code": "035",
                "active": true
            },
            {
                "name": "Zenith Bank",
                "slug": "zenith-bank",
                "code": "057",
                "active": true
            }
        ];
        let res = {};

        if (bvnExists) {
            let bvndata = {
                bvn,
                firstname: bvnExists.firstName,
                middlename: bvnExists.middleName,
                lastname: bvnExists.lastName,
                gender: bvnExists.gender,
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

        if (!firstname) {
            firstname = 'firstname';
        }

        if (!lastname) {
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
            timeout: 1500,
            data: JSON.stringify(body)
        });

        if (response.status == 201) {
            const customer = await Customer.findOne({
                where: {
                    [Op.or]: [{phone: response.data.data.phone}, {firstName: response.data.data.firstname},
                        {lastName: response.data.data.lastname}]
                }
            });

            const admin = await Admin.findOne({
                where: {
                    [Op.or]: [{phone: response.data.data.phone}, {firstName: response.data.data.firstname},
                        {lastName: response.data.data.lastname}]
                }
            });

            // data to save the the database.
            let newBvn = {
                bvn,
                firstName: response.data.data.firstname,
                middleName: response.data.data.middlename,
                lastName: response.data.data.lastname,
                gender: response.data.data.gender,
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
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.verifyNUBAN = async (bankCode, accountNumber) => {
    try {
        const response = await axios.request({
            url: `https://vapi.verifyme.ng/v1/banks/${bankCode}/accounts/${accountNumber}`,
            headers: getHeaders,
            timeout: 1500,
            method: 'GET'
        });

        response.data.data.account_name = response.data.data.accountName;

        return response.data;
    } catch (err) {
        console.error('VerfiyMe NUBAN Verification Error: ', err);
        return;
    }
}
