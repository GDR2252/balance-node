const express = require('express');

const router = express.Router();
const changeauthController = require('../controllers/changeauthController');

router.post('/', changeauthController.changepass);

module.exports = router;
