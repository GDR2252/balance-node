const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const listController = require('../controllers/listController');

router.post('/sportsList', auth, listController.sportsList);
router.get('/allEventsList', auth, listController.allEventsList);

module.exports = router;
