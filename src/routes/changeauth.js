const express = require('express');

const router = express.Router();
const changeauthController = require('../controllers/changeauthController');

router.post('/', changeauthController.changepass);
router.post('/changepassword', changeauthController.changepassword);
router.post('/forgotpassword', changeauthController.forgotpassword);
router.post('/verifyforgotpassword', changeauthController.verifyforgotpassword);

module.exports = router;
