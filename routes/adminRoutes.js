const express = require("express");
const router = express.Router();
const admin = require("../users/controllers/adminController");
const auth = require("../auth/authController");
const asset = require("../asset/controllers/assetController");

router.route('/assets')
    .post(auth.adminAuth, asset.create);

router.get('/assets/:id', auth.adminAuth, asset.get)
router.get('/assets', auth.adminAuth, asset.get)
router.patch('/assets/:id', auth.adminAuth, asset.edit)
router.delete('/assets/:id', auth.adminAuth, asset.delete)

router.post('/assign-role/:id', auth.adminAuth, admin.assignToRole)
router.post('/create-user', auth.adminAuth, admin.createAdminUser)

module.exports = router;