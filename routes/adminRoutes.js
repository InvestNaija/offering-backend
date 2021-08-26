const express = require("express");
const router = express.Router();
const admin = require("../users/controllers/adminController");
const auth = require("../auth/authController");
const asset = require("../asset/controllers/assetController");

router.route('/assets')
    .post(auth.adminAuth, asset.create);

router.get('/assets/:id', auth.adminAuth, asset.getOne)
router.get('/assets', auth.adminAuth, asset.getAll)
router.patch('/assets/:id', auth.adminAuth, asset.edit)
router.delete('/assets/:id', auth.adminAuth, asset.delete)

module.exports = router;