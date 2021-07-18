const express = require('express');
const router = express.Router();
const reservation = require('../asset/controllers/reservationController');
const auth = require('../auth/authController');


router.post('/express-interest', auth.brokerAndCustomerAuth, reservation.expressInterest)

router.post('/make-payment', auth.brokerAndCustomerAuth, reservation.payForReservation)

router.patch('/edit-reservation/:id', auth.customerAuth, reservation.editReservation)

router.post('/allotments/upload',  auth.adminAuth, reservation.uploadAllotment)

router.get('/', auth.adminAuth, reservation.getAll)

router.get('/allotments', auth.adminAuth, reservation.getAlloted)

router.get('/my-reservations', auth.customerAuth, reservation.getMyReservations)

router.get('/my-customers/count', auth.brokerAuth, reservation.brokerReservationsCount)

router.get('/my-customers/list', auth.brokerAuth, reservation.getAllbrokerReservations)

router.get('/allotments/my-customers/count', auth.brokerAuth, reservation.brokersAllotmentCount)

router.get('/all-customers/count', auth.adminAuth, reservation.AllCustomerReservationsCount)

router.get('/all-brokers/count', auth.adminAuth, reservation.AllBrokerReservationsCount)

router.get('/all-momoagents/count', auth.adminAuth, reservation.AllMomoAgentsReservationsCount)

router.get('/fetch/:id', reservation.fetch)

router.delete('/cancel/:id', auth.customerAuth, reservation.cancelReservation)

module.exports = router;
    