const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const loginController = require('../controllers/loginController');

router.post('/', auth, loginController.handleLogin);

module.exports = router;
