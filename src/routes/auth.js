const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const authController = require('../controllers/authController');

router.post('/login', auth, authController.handleLogin);
router.post('/', authController.aviatorAuth);
router.post('/v1/seamless/authorization', authController.aviatorAuth);

module.exports = router;
