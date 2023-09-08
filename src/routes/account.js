const express = require('express');

const router = express.Router();
const bankController = require('../controllers/accountController');

router.get('/statement', bankController.statement);
module.exports = router;
