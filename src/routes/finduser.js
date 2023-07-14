const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const userController = require('../controllers/userController');

router.post('/generateotp', auth, userController.generateotp);
router.post('/verifyotp', auth, userController.verifyotp);

module.exports = router;
