const db = require('../../models/index');
const AppError = require('../../config/appError');
const _ = require('underscore');
const Reservation = db.reservations;
const Customer = db.customers;
const Broker = db.brokers;
const Asset = db.assets;
const Transaction = db.transactions;
const transaction = require('../../finance/controllers/transactionController');
const sendEmail = require('../../config/email');
const {Op} = require('sequelize');
const formidable = require('formidable');
const csv = require('csv-parser');
const fs = require('fs');
const xmlBuilder = require('../../config/xmlBuilder');
const helper = require('../../config/helper');
const utils = require('../../config/utils')

exports.reserveAssetMTN = async (req, res, next) => {
    try {
        let errorId = helper.generateOTCode(6, false);
        let {amount, transactionid, accountholderid} = req.body;

        if(!module) {
            module = 'MTN e-Offering';
        }

        // check if agent id was passed
        // if (accountholderid) {
        //     accountholderid = accountholderid.slice(3, 13);
        // } else {
        //     accountholderid = null;
        // }

        if(!accountholderid) {
            accountholderid = null;
        }

        let msisdn = req.body.receivingfri;
        let pruned = msisdn.slice(4, 17);
        pruned = pruned.substring(3);
        pruned = `0${pruned}`;
        console.log(pruned)

        const user = await Customer.findOne({where: {phone: pruned}});
        if (!user) {
            res.send(xmlBuilder.paymentResponse(errorId, "FAILED", "user not found. " + msisdn));
            let resp = {
                code: 400,
                status: 'error',
                message: "user not found. " + msisdn
            }
            res.locals.resp = resp;
            return next()
        }
        // const asset = await Asset.findOne({where: {id: package}});
        // if(!asset) {
        //     res.send(xmlBuilder.paymentResponse(errorId, "FAILED", "invalid package."));
        //     let resp = {
        //         code: 400,
        //         status: 'error',
        //         message: "invalid package."
        //     }
        //     res.locals.resp = resp;
        //     return next()
        // }
        let assets = await Asset.findAll({});
        let asset = assets[0];
        let units = amount / asset.sharePrice;
        const reservation = await this.reserveAsset(user, asset, amount, units, null, true, "paid");
        if (!reservation) {
            res.send(xmlBuilder.paymentResponse(errorId, "FAILED", "transaction error."));
            let resp = {
                code: 400,
                status: 'error',
                message: "transaction error."
            }
            res.locals.resp = resp;
            return next()
        }
        let description = 'Payment Request via MTN';
        const tx = await transaction.createTransaction(description, amount, 'debit', user, null,
            reservation.id, transactionid, utils.SOURCE.EIPO, utils.CHANNEL.MTN, accountholderid, module);
        if (!tx) {
            res.send(xmlBuilder.paymentResponse(errorId, "FAILED", "transaction error."));
            let resp = {
                code: 400,
                status: 'error',
                message: "transaction error."
            }
            res.locals.resp = resp;
            return next()
        }

        res.send(xmlBuilder.paymentResponse(tx.reference, "COMPLETED", null))
        let resp = {
            code: 200,
            status: 'success',
            message: "Transaction success."
        }
        res.locals.resp = resp;
        return next()

    } catch (error) {
        console.error(error);
        let errorId = helper.generateOTCode(6, false);
        res.send(xmlBuilder.paymentResponse(errorId, "FAILED", error.message));
        let resp = {
            code: 500,
            status: 'error',
            message: error.message
        }
        res.locals.resp = resp;
        return next()
    }
}

exports.reserveAsset = async (user, asset, amount, units, brokerId, paid = false, status) => {
    try {
        let data = {
            unitsExpressed: units,
            amount,
            customerId: user.id,
            assetId: asset.id,
            brokerId,
            paid,
        }
        if (status) data.status = status;
        const reservation = await Reservation.create(data);
        let assetPop = asset.popularity++;
        await Asset.update({popularity: assetPop}, {where: {id: asset.id}});
        return reservation;
    } catch (error) {
        console.error(error);
        return;
    }
}

exports.editReservation = async (req, res, next) => {
    try {
        let reservationId = req.params.id;
        let {units} = req.body;
        if (!units) return next(new AppError('units required.', 400));
        const reservation = await Reservation.findOne({where: {id: reservationId}});
        if (!reservation) return next(new AppError('reservation not found.', 404));
        if (reservation.status !== 'pending' || reservation.paid) return next(new AppError('invalid reservation.', 403));
        let asset = await Asset.findByPk(reservation.assetId);
        if (!asset) return next(new AppError('Asset unavailable', 404));
        let amount = units * asset.sharePrice;
        await Reservation.update({unitsExpressed: units, amount}, {where: {id: reservation.id}});
        let resp = {
            code: 200,
            status: 'success',
            message: "Reservation Updated"
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.expressInterest = async (req, res, next) => {
    try {
        let userId;
        let brokerId;
        if (!req.user) return next(new AppError('Please login to access this resource', 401));
        if (req.user.role === 'customer') userId = req.user.id;
        else if (req.user.role === 'broker') {
            brokerId = req.user.id;
        }

        let {assetId, amount, units, customerId} = req.body;

        if(!units) {
            units = 0;
        }
        if (brokerId && !customerId) return next(new AppError('customerId is required', 400));
        if (customerId) userId = customerId
        if (!assetId || (units < 0)) return next(new AppError('All parameters required.', 400));
        // const assetReserved = await Reservation.findOne({where: {customerId: userId, assetId, status: 'pending'}});
        // if(assetReserved) return next(new AppError('You have already reserved this asset', 409));
        const asset = await Asset.findByPk(assetId);
        const user = await Customer.findByPk(userId);
        if (!user) return next(new AppError('User not found.', 404));
        // if(!user.cscsVerified) return next(new AppError('CSCS number unverified.', 406));
        if (!asset) return next(new AppError('Asset not found.', 404));
        // if(units > asset.availableShares) return next(new AppError('Units requested surpasses available shares', 406));

        if (!amount) {
            amount = units * asset.sharePrice;
        }

        let resp = {
            code: 200,
            status: 'success',
        }
        let reservation;
        if (asset.openForPurchase) {
            // let description = 'Shares Purchase';
            // let callback_url = `${process.env.APPLICATION_BASE_URL}/api/v1/transactions/shares/credit/success`;
            reservation = await this.reserveAsset(user, asset, amount, units, brokerId);
            if (!reservation) return next(new AppError('Error making reservation', 500));
            // const response = await transaction.initiateChargeCard(user, amount, description, reservation.id, callback_url, brokerId);
            // if(response.status !== 'success') return next(new AppError('Error initializing transaction', 500));
            // let data = {authorization_url: response.data.link};
            let data = {
                reservation,
                asset
            }
            resp.message = 'Asset reservation created.',
                resp.data = data;
            res.status(resp.code).json(resp);


        } else {
            reservation = await this.reserveAsset(user, asset, amount, units, brokerId);
            if (!reservation) return next(new AppError('Error making reservation', 500));
            resp.message = 'Asset reservation created. You\'ll be notified when asset is open.';
            let data = {
                reservation,
                asset
            }
            resp.data = data;
            res.status(resp.code).json(resp)

        }

        // check asset's send email flag to determine whether to send email
        if (asset.sendReservationEmail) {
            let opts = {
                email: user.email,
                subject: 'Asset Reservation Initiated',
                message: `<p>Dear ${user.firstName},</p>
            <p>Your Expression of Interest for the ${asset.name} with reference number <b>${reservation.id}</b> has been successfully
            received. Please record your reference number in a safe and secure place.</p>
            <p>We will send you an email/ notice of pricing and a request for confirmation of the expression of
            interest when the offer price is set.</p>
            <p>Thank you.</p>
            <p>For further enquiries, please send an <a href = "mailto: investnaija@chapelhilldenham.com">email</a> to investnaija@chapelhilldenham.com or call < phone number>.</p>
            <p><b>This is an automated message, please do not reply directly to the email.</b></p>
            `
            }
            sendEmail(opts).then(r => console.log('reservation email sent')).catch(err => console.log('error sending reservation email', err));
        }

        // Send Email notifcation to Admin and Customer admin=investnaija@chapelhilldenham.com
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.payForReservation = async (req, res, next) => {
    try {
        let customerId;
        let brokerId;
        let {gateway, currency, reinvest, redirectUrl} = req.body;
        let response = {};

        if (!gateway) return next(new AppError('gateway required', 400));
        gateway = gateway.toLowerCase();
        if (gateway !== 'flutterwave' && gateway !== 'access') return next(new AppError('Invalid gateway specidied', 400));
        if (!req.user) return next(new AppError('Please login to access this resource', 401));
        if (req.user.role === 'customer') customerId = req.user.id;
        else if (req.user.role === 'broker') brokerId = req.user.id;
        else return next(new AppError('You\re unauthorized to access this resource', 403));
        let {reservationId} = req.body;
        if (!reservationId) return next(new AppError('reservationId required', 400))
        if (brokerId) {
            customerId = req.body.customerId;
            if (!customerId) return next(new AppError('customerId is required', 400));
        }
        const reservation = await Reservation.findOne({
            where: {
                id: reservationId
            }, include: ['customer', 'asset']
        });

        // set reinvest flag based on user preference
        if (reinvest && reservation) {
            reservation.reinvest = reinvest;

            await reservation.save();
        }

        if (!reservation) return next(new AppError('Reservation not found', 404));
        if (reservation.customerId !== customerId) return next(new AppError('Invalid customer', 403));
        if (reservation.paid) return next(new AppError('Reservation has already been paid', 403));
        if (!reservation.asset.openForPurchase) return next(new AppError('Asset is currently not open for purchase', 403));
        // if(!reservation.customer.dataValues.cscsVerified) return next(new AppError('customer cscs unverified.', 403));
        let amount = reservation.amount;
        let description = 'Shares Purchase';
        if (gateway === 'flutterwave') {
            let callback_url;

            if (redirectUrl) {
                callback_url = `${process.env.APPLICATION_BASE_URL}/api/v1/transactions/shares/credit/success?redirectUrl=${redirectUrl}`;
            } else {
                callback_url = `${process.env.APPLICATION_BASE_URL}/api/v1/transactions/shares/credit/success`;
            }

            // check if it's dollar payment and process with dollar method
            if (reservation.asset.currency === 'USD') {
                if (reservation.asset.subaccountId) {
                    response = await transaction.initiateDollarCardPayment(reservation.customer.dataValues,
                        amount, description, reservation.id, callback_url, brokerId, reservation.asset.subaccountId);
                } else {
                    response = await transaction.initiateDollarCardPayment(reservation.customer.dataValues,
                        amount, description, reservation.id, callback_url, brokerId, 'null');
                }
            } else {
                response = await transaction.initiateChargeCard(reservation.customer.dataValues, amount,
                    description, reservation.id, callback_url, brokerId);
            }

            if (response.status !== 'success') return next(new AppError('Error initializing transaction', 500));
            let data = {authorization_url: response.data.link};
            let resp = {
                code: 200,
                status: 'success',
                message: 'Payment link generated',
                data
            }
            res.status(resp.code).json(resp);
            res.locals.resp = resp;
        } else {
            let {cardDetail} = req.body;
            if (!cardDetail) return next(new AppError('card details required', 400));
            let details = ['number', 'expirationMonth', 'expirationYear', 'cvv', 'firstName', 'lastName'];
            details.map(item => {
                if (!cardDetail[item]) return next(new AppError(`${item} is required`, 400));
            })
            let billTo = {
                address1: reservation.customer.dataValues.address,
                locality: "Lagos",
                administrativeArea: "LG",
                phoneNumber: reservation.customer.dataValues.phone,
                email: reservation.customer.dataValues.email,
                firstName: reservation.customer.dataValues.firstName,
                lastName: reservation.customer.dataValues.lastName,
                country: "Nigeria",
                company: "",
                postalCode: "108102"
            };
            const response = await transaction.tokenizedPayment(reservation.customer.dataValues, cardDetail, billTo, amount, reservation.id, brokerId, description);
            if (response !== 'success') return next(new AppError('Error processing transaction', 500));
            res.redirect(`${process.env.FRONTEND_URL}/user/dashboard/transactions/`);
            let resp = {
                code: 200,
                status: "success",
                message: 'Share purchase successful.',
            }
            res.locals.resp = resp;
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.uploadAllotment = async (req, res, next) => {
    try {
        const form = new formidable({multiples: true});
        let upload;
        let allotmentData = [];
        let assetId;
        form.on('file', (name, file) => {
            upload = file
        })
            .on('field', (name, field) => {
                assetId = field;
            })
            .on('end', async () => {
                if (!assetId) return next(new AppError('asset is required', 400));
                if (!upload) return next(new AppError('Allotment document required', 400));
                const asset = await Asset.findByPk(assetId);
                if (!asset) return next(new AppError('Asset not found.', 404));
                console.log(upload.type);
                // if(upload.type !== 'text/csv' || upload.type !== 'application/vnd.ms-excel') {
                //     return next(new AppError('Wrong file format', 400));
                // }

                // console.log(upload.path, assetId);
                let fileupload = fs.createReadStream(upload.path)
                fileupload.pipe(csv())
                    .on('data', function (row) {
                        if (!row.cscs || !row.units) {
                            fileupload.destroy();
                            return next(new AppError('Invalid data structure', 400));
                        }
                        allotmentData.push(row);
                    })
                    .on('end', async () => {
                        console.log('csv file processed');
                        let resp = {
                            code: 200,
                            status: 'success',
                            message: 'Allotment file uploaded',
                        }
                        res.status(resp.code).json(resp)
                        console.log(allotmentData)
                        const reservations = await Reservation.findAll({where: {assetId, status: 'paid', paid: true}});
                        // const customers = reservations.map(item=> item.customerId);
                        const customers = reservations.map(item => {
                            let obj = {};
                            obj.customerId = item.customerId;
                            obj.reservationId = item.id;
                            obj.reserved = item.unitsExpressed;
                            obj.amount = item.amount;
                            return obj;
                        });
                        for (let i = 0; i < allotmentData.length; i++) {
                            let row = allotmentData[i];
                            const customer = await Customer.findOne({where: {cscs: row.cscs}});
                            if (!customer) {
                                console.log('customer not found with cscs: ' + row.cscs);
                                continue;
                            }
                            // if(customers.includes(customer.id)) {
                            //     await Reservation.update({unitsAlloted: row.units, status: 'alloted'}, {where: {assetId, customerId: customer.id, paid: true}});
                            //     console.log('allotment updated');
                            // } else console.log(`customer with email: ${customer.email} not found with pending reservations for this asset`);
                            const reservationObj = customers.find(item => item.customerId === customer.id);
                            if (!reservationObj) {
                                console.log('customer has no reservations');
                                continue;
                            }
                            let balance = reservationObj.reserved - row.units;
                            if (balance < 0) {
                                console.log('alloted units exceed reservation for customer with cscs: ' + row.cscs);
                                continue;
                            }
                            let refund = 'non';
                            if (balance > 0) refund = 'pending';
                            await Reservation.update({
                                unitsAlloted: row.units,
                                status: 'alloted',
                                unitsRefund: balance,
                                refund
                            }, {
                                where: {
                                    id: reservationObj.reservationId,
                                    assetId,
                                    customerId: customer.id,
                                    paid: true
                                }
                            });
                            console.log('allotment updated');
                            let opts = {
                                email: customer.email,
                                subject: 'Verify Your Account',
                                message: `<p>Dear ${customer.firstName},</p>
                        <p>Congratulations, you are now an ${asset.name} shareholder.</p>
                        <p>Please find the total value of your investment units below.</p>
                        <table style="width:100%">
                            <tr>
                                <th>Shareholder's Name</th>
                                <th>${customer.firstName} ${customer.lastName}</th>
                            </tr>
                            <tr>
                                <th>CSCS Account Number</th>
                                <th>${customer.cscs}</th>
                            </tr>
                            <tr>
                                <th>CHNr</th>
                                <th>${customer.chn}</th>
                            </tr>
                            <tr>
                                <th>Cost per unit</th>
                                <th>${reservationObj.amount / reservationObj.unitsExpressed}</th>
                            </tr>
                            <tr>
                                <th>Total Units</th>
                                <th>${row.units}</th>
                            </tr>
                        </table>
                        <p>Your shares have been credited to your CSCS account.</p>
                        <p>Thank you for participating in the ${asset.name} share offer.</p>
                        <p>For further enquiries, please send an <a href = "mailto: investnaija@chapelhilldenham.com">email</a> to investnaija@chapelhilldenham.com or call < phone number>.</p>
                        <p><b>This is an automated message, please do not reply directly to the email.</b></p>
                        <p>Best Regards,</p>
                        <p>The Invest Naija Team.</p>
                        `
                            }
                            sendEmail(opts).then(r => console.log('allotment email sent')).catch(err => console.log('error sending allotment email', err))
                        }
                        res.locals.resp = resp;
                        return next()
                    })
            })
        form.parse(req);

    } catch (error) {
        return next(error);
    }
}

exports.getAll = async (req, res, next) => {
    try {
        const data = await Reservation.findAll({include: ['customer', 'asset']});
        let resp = {
            code: 200,
            status: 'success',
            message: 'All reservations fetched',
            data
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.fetch = async (req, res, next) => {
    try {
        let reservationId = req.params.id;
        const reservation = await Reservation.findOne({where: {id: reservationId}, include: ['customer', 'asset']});
        if (!reservation) return next(new AppError('Reservation not found', 404));
        let resp = {
            code: 200,
            status: 'success',
            message: 'Reservation fetched',
            data: reservation
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
    } catch (error) {
        return next(error);
    }
}

exports.getAlloted = async (req, res, next) => {
    try {
        const data = await Reservation.findAll({where: {status: 'alloted'}, include: ['customer', 'asset']});
        let resp = {
            code: 200,
            status: 'success',
            message: 'Alloted reservations fetched',
            data
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getMyReservations = async (req, res, next) => {
    try {
        let customerId = req.user.id;
        const data = await Reservation.findAll({where: {customerId}, include: ['customer', 'asset']});
        let resp = {
            code: 200,
            status: 'success',
            message: 'customer\'s reservations fetched',
            data
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.brokerReservationsCount = async (req, res, next) => {
    try {
        let brokerId = req.user.id;
        const count = await Reservation.count({where: {brokerId}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'broker\'s reservations count fetched',
            count
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.brokersAllotmentCount = async (req, res, next) => {
    try {
        let brokerId = req.user.id;
        const count = await Reservation.count({where: {brokerId, status: 'alloted'}});
        let resp = {
            code: 200,
            status: 'success',
            message: 'broker\'s reservations count fetched',
            count
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.AllCustomerReservationsCount = async (req, res, next) => {
    try {
        const count = await Reservation.count({
            where: {
                brokerId: {
                    [Op.is]: null
                }
            }
        })
        let resp = {
            code: 200,
            status: 'success',
            message: 'all customers reservations count fetched',
            count
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.AllMomoAgentsReservationsCount = async (req, res, next) => {
    try {
        const reservations = await Reservation.findAll({
            where: {
                brokerId: {
                    [Op.ne]: null
                }
            }, include: 'broker'
        });


        let brokers = reservations.map(item => item.dataValues.broker);
        let mtnBrokers = brokers.filter(item => item.dataValues.type === 'mtn');
        let resp = {
            code: 200,
            status: 'success',
            message: 'all momoagents reservations count fetched',
            count: mtnBrokers.length
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.AllBrokerReservationsCount = async (req, res, next) => {
    try {
        const count = await Reservation.count({
            where: {
                brokerId: {
                    [Op.ne]: null
                }
            }
        })
        let resp = {
            code: 200,
            status: 'success',
            message: 'all brokers reservations count fetched',
            count
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.getAllbrokerReservations = async (req, res, next) => {
    try {
        let brokerId = req.user.id;
        const reservations = await Reservation.findAll({where: {brokerId}, include: ['asset', 'customer']});
        let resp = {
            code: 200,
            status: 'success',
            message: 'broker\'s reservations fetched',
            data: reservations
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.expressInterestViaMTN = async (req, res, next) => {
    try {
        let {assetId, units, bvn, amount} = req.body;
        if (!assetId || !units || !bvn) return next(new AppError('assetId and units parameters required.', 400));
        const user = await Customer.findOne({where: {bvn}});
        if (!user) return next(new AppError('invalid user', 404));
        const asset = await Asset.findByPk(assetId);
        if (!asset) return next(new AppError('Asset not found.', 404));
        if (!asset.openForPurchase) return next(new AppError('This asset is currently not open for purchase', 400));
        let paid = true;
        const reservation = await reserveAsset(user, asset, amount, units, paid);
        if (reservation.error) return next(new AppError('Error making reservation', 500));
        let resp = {
            code: 200,
            status: 'success',
            message: 'Asset successfully reserved',
            data
        }
        res.status(resp.code).json(resp)
        res.locals.resp = resp;
        return next();
    } catch (error) {
        return next(error);
    }
}

exports.cancelReservation = async (req, res, next) => {
    try {
        let reservationId = req.params.id;
        if (!reservationId) {
            return next(new AppError(`Reservation id: ${reservationId} should be provided.`));
        }

        // safely delete reservation
        await Reservation.destroy({
            where: {
                id: reservationId
            }
        });

        const resp = {
            code: 200,
            status: 'success',
            message: 'Reservation cancelled successfully',
        }

        res.status(resp.code).json(resp);
        res.locals.resp = resp;
        return next();
    } catch (error) {
        console.error(error);
        return next(error);
    }
}
