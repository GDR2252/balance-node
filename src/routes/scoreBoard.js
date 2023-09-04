const express = require('express');

const router = express.Router();
const scoreController = require('../controllers/scoreboardController');

router.post('/', scoreController.addScore);
router.get('/', scoreController.fetchScore);
router.get('/fetch', scoreController.fetchScoreid);
router.delete('/', scoreController.deleteScore);

module.exports = router;
