const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const registerController = require('../controllers/registerController');

router.post('/', auth, registerController.handleNewUser);
router.post('/generateotp', auth, registerController.generateotp);
router.post('/verifyotp', auth, registerController.verifyotp);
router.post('/resendotp', auth, registerController.resendOtp);
router.post('/forgotpassword', auth, registerController.forgotpassword);
router.post('/verifyforgotpassword', auth, registerController.verifyforgotpassword);

module.exports = router;
