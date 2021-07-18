const express = require('express');
const router = express.Router();
const asset = require('../asset/controllers/assetController');
const auth = require('../auth/authController');

router.route('/')
    .post(auth.adminAuth, asset.create)
    .get(asset.getAll)

router.get('/open-assets', asset.getOpen)
router.get('/top-assets', asset.getTop)
router.get('/popular', asset.getPopular)
router.route('/:id')
    .get(asset.getOne)
    .patch(auth.adminAuth, asset.edit)
    
module.exports = router;