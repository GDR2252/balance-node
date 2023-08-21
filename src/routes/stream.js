const express = require('express');

const router = express.Router();
const streamController = require('../controllers/streamSheduleController');

router.get('/', streamController.getStream);
module.exports = router;
