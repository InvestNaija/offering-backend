const Cypher = require('./Cypher');
const cypher = new Cypher(process.env.AES_KEY, process.env.IV_KEY);
const axios = require('axios').default;

exports.encrypt = (data) => {
    const encrypted = cypher.encrypt(JSON.stringify(data))
    return encrypted;
}

exports.decrypt = (str) => {
    const decrypted = cypher.decrypt(str);
    return JSON.parse(decrypted);
}

exports.TokenizeCard = async(cardDetails, billTo) => {
    try {
        
        let data = this.encrypt({
            request: {
                descriptorName: "TokenizeCard",
                cardDetail: cardDetails,
                billTo
            }
        });
        let body = {data}
        const response = await axios.request({
            method: 'POST',
            url: `${process.env.ACCESS_API_URL}/api/v2/tms/create`,
            headers: {
                "apiKey": process.env.ACCESS_API_KEY,
                "Content-Type": "application/json"
            },
            data: JSON.stringify(body)
        })
        return this.decrypt(response.data.data);
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.TokenizedPayment = async(requestData) => {
    try {
        // console.log(requestData)
        requestData.currency = "NGN";
        let data = this.encrypt(requestData);
        // console.log(data);
        let body = {
            data
        };
        const response = await axios.request({
            method: 'POST',
            url: `${process.env.ACCESS_API_URL}/api/v2/tms/payment`,
            data: JSON.stringify(body),
            headers: {
                "apiKey": process.env.ACCESS_API_KEY,
                "Content-Type": "application/json"
            }
        })
        return this.decrypt(response.data.data);
    } catch (error) {
        console.error(error.response);
        return;
    }
}

exports.CapturePayment = async(amount, authorizedPaymentId, merchantRef, descriptor, billTo, cardDetail) => {
    try {
        let data = this.encrypt({
            request: {
                currency: "NGN",
                amount,
                authorizedPaymentId,
                merchantRef,
                descriptor,
                cardDetail,
                billTo
            }
        });
        let body = {
            data
        }
        const response = await axios.request({
            method: 'POST',
            url: `${process.env.ACCESS_API_URL}/api/v2/payment/capture/`,
            data: JSON.stringify(body),
            headers: {
                "apiKey": process.env.ACCESS_API_KEY,
                "Content-Type": "application/json"
            }
        })
        return this.decrypt(response.data.data);
    } catch (error) {
        console.error(error.response);
        return;
    }
}

exports.createVnuban = async(data) => {
    try {
        let post = this.encrypt(data);
        let body = {
            data: post
        }
        const response = await axios.request({
            method: 'POST',
            url: `https://api-sandbox.accessbankplc.com/acc-gateway/v1/vnuban/account`,
            data: JSON.stringify(body),
            headers: {
                "applicationId": process.env.ACCESS_APP_ID,
                "Authorization": `Bearer ${process.env.ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": process.env.ACCESS_SUBSCRIPTION_KEY
            }
        })
        return this.decrypt(response.data.data);
    } catch (error) {
        console.error(error);
        return;
    }
}