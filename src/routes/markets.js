const express = require('express');

const router = express.Router();
const marketsController = require('../controllers/marketController');

router.post('/', marketsController.addMarkets);
router.get('/', marketsController.fetchMarkets);
router.post('/update', marketsController.updateMarkets);
router.delete('/', marketsController.deleteMarkets);

module.exports = router;
