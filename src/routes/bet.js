const express = require('express');

const router = express.Router();
const betController = require('../controllers/betController');

router.post('/', betController.placebet);
router.get('/fetch/cricket', betController.fetchCricket);
router.get('/fetch/cricket/pl', betController.fetchPl);
router.get('/history', betController.history);
module.exports = router;
