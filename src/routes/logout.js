const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const logoutController = require('../controllers/logoutController');

router.get('/', auth, logoutController.handleLogout);

module.exports = router;
