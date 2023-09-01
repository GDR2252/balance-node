const express = require('express');

const router = express.Router();
const sportsController = require('../controllers/sportsController');

router.post('/', sportsController.addSports);
router.get('/', sportsController.fetchSports);
router.get('/dropdown', sportsController.fetchSportsDropdown);
router.post('/update', sportsController.updateSports);
router.delete('/', sportsController.deleteSports);

module.exports = router;
