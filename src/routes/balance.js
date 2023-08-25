const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getBalance);
router.post('/update', userController.updateBalance);
module.exports = router;
