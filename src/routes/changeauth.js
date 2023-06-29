const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const changeauthController = require('../controllers/changeauthController');

router.post('/', auth, changeauthController.changepass);

module.exports = router;
