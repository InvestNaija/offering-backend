const axios = require('axios').default;
const AppError = require('./appError');
require('dotenv').config();

exports.verifyCSCS = async(cscs) => {
    try {
        let post = {
            cscsno: cscs,
            username: process.env.CSCS_API_USERNAME,
            webtoken: process.env.CSCS_API_WEBTOKEN
        }
        let data = JSON.stringify(post);
        const response = await axios.request({
            url: `${process.env.CSCS_VALIDATION_URL}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.createCSCS = async(user) => {
    try {
        user.Member = "CHDS";
        user.AccountType = "I",
        user.NIN = "";
        user.Guardian = "";
        user.Address2 = "";
        user.Address3 = "";
        user.Postal = "23401";
        user.Phone2 = "";
        user.BOPDate = "20190902";
        user.REQDate = "";
        user.NXPhone = "";
        user.AltEmail = "";
        user.RCNumber = "";
        user.NIMCNo = "";
        user.NXCHN = "";
        user.SortCode = "";
        user.RCDate = "";
        user.TaxId = "";
        const accountList = [];
        accountList.push(user);
        let cscsObj = {}
        cscsObj.accountList = accountList;
        cscsObj.username = process.env.CSCS_API_USERNAME;
        cscsObj.webtoken = process.env.CSCS_API_WEBTOKEN;
        const response = await axios.request({
            url: 'http://apitest.cscs.ng:8021/api/cscsAccount',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(cscsObj)
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.checkCSCSCreation = async(ref) => {
    try {
        let post = {
            refNo: ref,
            member: "CHD",
            username: process.env.CSCS_API_USERNAME,
            webtoken: process.env.CSCS_API_WEBTOKEN
        }
        const response = await axios.request({
            url: 'http://apitest.cscs.ng:8021/api/AccountOpeningStatus',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: post
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return new AppError(error.response.data.message, error.response.status);
    }
}
