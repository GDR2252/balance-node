const express = require('express');

const router = express.Router();
const helperController = require('../controllers/helperController');

router.post('/getselection', helperController.getselection);

module.exports = router;
