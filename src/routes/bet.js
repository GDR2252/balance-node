const express = require('express');

const router = express.Router();
const betController = require('../controllers/betController');

router.post('/', betController.placebet);
router.get('/fetch/cricket', betController.fetchCricket);
router.get('/fetch/cricket/menu', betController.fetchCricketBetMenu);
router.get('/fetch/cricket/pl', betController.fetchPl);
router.get('/history', betController.history);
router.get('/aviator/pl', betController.aviatorPl);
router.get('/aviator/total', betController.aviatorSumOfPl);
router.get('/casino/pl', betController.casinoPl);
router.get('/casino/round', betController.fetchCasinoByRound);

module.exports = router;
