const express = require('express');

const router = express.Router();
const eventsController = require('../controllers/eventsController');

router.post('/', eventsController.addEvents);
router.get('/', eventsController.fetchEvents);
router.post('/update', eventsController.updateEvents);
router.delete('/', eventsController.deleteEvents);

module.exports = router;
