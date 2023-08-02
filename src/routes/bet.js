const express = require('express');

const router = express.Router();
const betController = require('../controllers/betController');

router.get('/', betController.placebet);
module.exports = router;
