const cron = require('node-cron');
const db = require('../models/index');
const Customer = db.customers;
const Reservation = db.reservations;
const Wallet = db.wallets;
const Token = db.tokens;
const cscs = require('./cscs');
const {sendEmail} = require('./email');
const { Op } = require('sequelize');
const moment = require('moment');

exports.checkCSCSCreation = cron.schedule('*/15 * * * *', async()=>{
    console.log('Running Cron Operation [check for updated cscs details]');
    try {
        const requestedCustomers = await Customer.findAll({where: {cscsVerified: false, cscsRequestStatus: 'requested'}});
        if(requestedCustomers.length > 0) {
            let refs = requestedCustomers.map(item => {
                let obj = {};
                obj.ref = item.cscsRef;
                obj.email = item.email;
                obj.firstName = item.firstName
                return obj;
            });
            for(let i=0; i<refs.length; i++) {
                let ref = refs[i].ref;
                const response = await cscs.checkCSCSCreation(ref);
                console.log('cscsResponse: ' + JSON.stringify(response));
                if(!response.cscsNo || response.cscsNo === "") {
                    console.log('cscs yet to be created for ref: '+ ref);
                    continue;
                }
                await Customer.update({cscs: response.cscsNo, cscsVerified: true, chn: response.CHN}, {where: {cscsRef: ref}});
                let opts = {
                    from: 'Invest Naija <hello@9id.com.ng>',
                    email: refs[i].email,
                    subject: 'CSCS Account created',
                    message: `<p>Hello ${refs[i].firstName},</p>
                    <p>Your CSCS account has been successfully created.</p>
                    <p>CSCS Number: <b>${response.cscsNo}</b></p>
                    <p>CHN Number: <b>${response.CHN}</b></p>
                    <p>Best Regards,</p>
                    <p>The Invest Naija Team.</p>
                    `
                }
                sendEmail(opts).then(r=>console.log('cscs sent to customer')).catch(err=>console.log('error sending cscs to customer', err));
            }
        } else {
            console.log('no customers with active cscs request at the moment');
            return;
        }
        
    } catch (error) {
        console.error(error);
    }
})

exports.refundAllotmentBalance = cron.schedule('30 * * * *', async()=>{
    console.log('Running Cron Operation [refund allotment balances]');
    try {
        const reservations = await Reservation.findAll({where: {status: 'alloted', refund: 'pending'}, include: 'asset'});
        if(reservations.length > 0) {
            reservations.map(async item => {
                let amount = item.unitsRefund * item.asset.sharePrice;
                await Wallet.update({balance: amount}, {where: {customerId: item.customerId}});
                console.log('wallet updated');
                await Reservation.update({refund: 'refunded'}, {where: {id: item.id}});
                console.log('reservation updated');
            })
        } else console.log('no eligible reservations');
        
    } catch (error) {
        console.error(error);
    }
})

exports.deleteUsedTokens = cron.schedule('45 * * * *', async()=>{
    console.log('Running Cron Operation [delete expired tokens]');
    try {
        await Token.destroy({where: {used: true}});
        await Token.destroy({where: {createdAt: {
            [Op.gt]: moment().subtract(1, 'h').toDate()
        }}})
    } catch (error) {
        console.error(error);
    }
})
