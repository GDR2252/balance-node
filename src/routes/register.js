const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const registerController = require('../controllers/registerController');

router.post('/', registerController.handleNewUser);
router.post('/generateotp', auth, registerController.generateotp);
router.post('/verifyotp', auth, registerController.verifyotp);
router.post('/resendotp', auth, registerController.resendOtp);
router.post('/forgotpassword', auth, registerController.forgotpassword);
router.post('/verifyforgotpassword', auth, registerController.verifyforgotpassword);
router.post('/changeforgotpassword', auth, registerController.changeforgotpassword);

module.exports = router;
