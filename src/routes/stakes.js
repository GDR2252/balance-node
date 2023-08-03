const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.fetchstakes);
router.post('/update', userController.savestakes);
module.exports = router;
