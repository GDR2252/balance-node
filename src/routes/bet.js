const express = require('express');

const router = express.Router();
const betController = require('../controllers/betController');

router.post('/', betController.placebet);
module.exports = router;
