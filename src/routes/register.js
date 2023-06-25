const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const registerController = require('../controllers/registerController');

router.post('/', auth, registerController.handleNewUser);

module.exports = router;
