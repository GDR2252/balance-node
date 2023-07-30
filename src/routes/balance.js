const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.getBalance);
router.post('/update', userController.updateBalance);
module.exports = router;
