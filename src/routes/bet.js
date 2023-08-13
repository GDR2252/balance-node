const express = require('express');

const router = express.Router();
const betController = require('../controllers/betController');

router.post('/', betController.placebet);
router.post('/fetch/cricket', betController.fetchCricket);
router.post('/fetch/cricket/pl', betController.fetchPl);
module.exports = router;
