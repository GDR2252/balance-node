const express = require('express');

const router = express.Router();
const changeauthController = require('../controllers/changeauthController');

router.post('/', changeauthController.changepass);
router.post('/changepassword', changeauthController.changepassword);

module.exports = router;
