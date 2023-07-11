const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const registerController = require('../controllers/registerController');

router.post('/', auth, registerController.handleNewUser);
router.post('/generateotp', auth, registerController.generateotp);
router.post('/verifyotp', auth, registerController.verifyotp);
router.post('/resendotp', registerController.resendOtp);
router.post('/changepassword', registerController.changePassword);

module.exports = router;
