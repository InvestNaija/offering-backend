const express = require('express');
const router = express.Router();

const verification = require('../users/controllers/verificationController');


router.post('/cscs', verification.cscsCallback);

module.exports = router;