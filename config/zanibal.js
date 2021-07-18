const axios = require('axios').default;
const AppError =  require('./appError');

exports.registerCustomer = async(firstName, lastName, email, phone, bvnCode) => {
    try {
        let post = {
            active: true,
            businessOfficeName: "0000000002",
            bvnCode,
            cellPhone: phone,
            channel: "WEB",
            customerType: "REGULAR",
            customerGroupName: "001",
            emailAddress1: email,
            firstName,
            lastName
        }
        const response = await axios.request({
            url: 'http://apps.demo.zanibal.com/ebclient/rest/api/v1/partner/customer/create',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(post)
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.fetchCustomer = async(zanibalId) => {
    try {
        const response = await axios.request({
            url: `http://apps.demo.zanibal.com/ebclient/rest/api/v1/security/customer/id/${zanibalId}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.getActiveSecurities = async(page, perPage) => {
    try {
        const response = await axios.request({
            url: `http://apps.demo.zanibal.com/ebclient/rest/api/v1/order/security/list/active?x=NSE&t=EQUITY&b=${page}&s=${perPage}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.getPortfolio = async(id) => {
    try {
        id = 5377069; //temp
        const response = await axios.request({
            url: `http://apps.demo.zanibal.com/ebclient/rest/api/v1/order/portfolio/customer/id/${id}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.getPortfolioBalance = async (portfolioId) => {
    try {
        portfolioId = 6172304;
        const response = await axios.request({
            url: `http://apps.demo.zanibal.com/ebclient/rest/api/v1/partner/portfolio-trade-balance/id/${portfolioId}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.getCashAccount = async(id) => {
    try {
        id = 5377069; //temp
        const response = await axios.request({
            url: `http://apps.demo.zanibal.com/ebclient/rest/api/v1/finance/account/customer/id/${id}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.getChartData = async(name, date) => {
    try {
        const response = await axios.request({
            url: `https://cp-mds.zanibal.com/mds//rest/api/v1/research/get-chart-data/symbol?x=NSE&f=d,o,h,l,c&s=${name}&t=${date}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.getSecurityDetails = async(name) => {
    try {
        const response = await axios.request({
            url: `https://cp-mds.zanibal.com/mds/rest/api/v1/research/get-security-overview/symbol?x=NSE&s=${name}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.getOrderTerms = async() => {
    try {
        const response = await axios.request({
            url: `http://apps.demo.zanibal.com/ebclient/rest/api/v1/order/tradeorderterm/list/active`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.getTopGainers = async() => {
    try {
        const response = await axios.request({
            url: `http://mds.zanibal.com/mds/rest/api/v1/research/get-market-movers?x=NSE&t=TOP_PERCENT_GAINER&c=10`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        cconsole.error(error);
        return;
    }
}

exports.getTopLoosers = async() => {
    try {
        const response = await axios.request({
            url: `http://mds.zanibal.com/mds/rest/api/v1/research/get-market-movers?x=NSE&t=TOP_PERCENT_LOOSER&c=10`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.getTradeOrders = async (id) => {
    try {
        id = 6172304; //temp
        const response = await axios.request({
            url: `http://apps.demo.zanibal.com/ebclient/rest/api/v1/order/tradeorder/portfolio/list?p=${id}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`
            }
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.validateTradeOrder = async(data) => {
    try {
        const response = await axios.request({
            url: 'http://apps.demo.zanibal.com/ebclient/rest/api/v1/order/tradeorder/validate',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.createTradeOrder = async(data) => {
    try {
        const response = await axios.request({
            url: 'http://apps.demo.zanibal.com/ebclient/rest/api/v1/order/tradeorder/submit',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.createCashTransaction = async(data) => {
    try {
        const response = await axios.request({
            url: 'http://apps.demo.zanibal.com/ebclient/rest/api/v1/finance/cash-transaction/create',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.postCashTransaction = async(transaction_id) => {
    try {
        const response = await axios.request({
            url: 'http://apps.demo.zanibal.com/ebclient/rest/api/v1/finance/cash-transaction/post/' + transaction_id,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${process.env.ZANNIBAL_API_AUTH}`,
                'Content-Type': 'application/json'
            },
            data: null
        })
        return response.data;
    } catch (error) {
        console.error(error);
        return;
    }
}
