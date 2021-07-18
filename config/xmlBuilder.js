const builder = require('xmlbuilder');

class xmlParser {
    static verifyRequest = async (req, res, next) => {
        req.body['accountholderid'] = '';
        req.body['resource'] = '';
        if (req.body) {
            if (req.body['ns0:getfinancialresourceinformationrequest']) {
                let {accountholderid, resource} = req.body['ns0:getfinancialresourceinformationrequest']

                if (accountholderid && resource) {
                    accountholderid = accountholderid[0]
                    resource = resource[0]
                    if (accountholderid && resource) {
                        req.body['accountholderid'] = accountholderid;
                        req.body['resource'] = resource;
                        delete req.body['ns0:getfinancialresourceinformationrequest'];
                    }
                }
            }
        }
        next();
    }

    static verifyResponse = (customername, plan, status, message) => {
        const obj = {
            'ns0:getfinancialresourceinformationresponse': {
                '@xmlns:ns0': "http://www.ericsson.com/em/emm/serviceprovider/v1_0/backend/client",
                message: {
                    '#text': message
                },
                extension: {
                    status: {
                        '#text': status
                    },
                    error: {
                        '#text': status
                    },
                    customername: {
                        '#text': customername
                    },
                    amount: {
                        '#text': 0
                    },
                    package: {
                        '#text': plan
                    },
                    description: {
                        '#text': message
                    }
                }
            }
        };
        return builder.create(obj).end({pretty: true});
    }

    static paymentRequest = async (req, res, next) => {
        req.body['accountholderid'] = '';
        req.body['receivingfri'] = '';
        req.body['amount'] = 0;
        req.body['transactionid'] = '';
        if (req.body) {
            if (req.body['ns0:paymentrequest']) {
                let {accountholderid, receivingfri, transactionid, amount} = req.body['ns0:paymentrequest']
                if (accountholderid && receivingfri && transactionid && amount) {
                    accountholderid = accountholderid[0];
                    receivingfri = receivingfri[0];
                    transactionid = transactionid[0]
                    amount = amount[0]
                    if (accountholderid && receivingfri && transactionid && amount) {
                        amount = amount.amount
                        if (amount) {
                            amount = amount[0]
                            if (amount) {
                                req.body['accountholderid'] = accountholderid;
                                req.body['receivingfri'] = receivingfri;
                                req.body['amount'] = amount;
                                req.body['transactionid'] = transactionid;
                                delete req.body['ns0:paymentrequest'];
                            }
                        }
                    }
                }
            }
        }
        next();
    }

    static paymentResponse = (providertransactionid, status = 'COMPLETED', message = "") => {
        const obj = {
            'ns2:paymentresponse': {
                '@xmlns:ns2': "http://www.ericsson.com/em/emm/serviceprovider/v1_3/backend/client",
                status: {
                    '#text': status
                },
                providertransactionid: {
                    '#text': providertransactionid
                },
                message: {
                    '#text': message
                }
            }
        };
        return builder.create(obj).end({pretty: true});
    }
}

module.exports = xmlParser
