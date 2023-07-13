const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

router.post('/generateotp', userController.generateotp);
router.post('/verifyotp', userController.verifyotp);

module.exports = router;
