const express = require('express');

const router = express.Router();
const bankController = require('../controllers/accountController');

router.get('/statement', bankController.history);
module.exports = router;
