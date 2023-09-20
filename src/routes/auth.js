const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const authController = require('../controllers/authController');

const verifyJWT = require('../middleware/verifyJWT');

router.post('/', auth, authController.handleLogin);
router.get('/gettoken', verifyJWT, authController.generateToken);

module.exports = router;
