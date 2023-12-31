const express = require('express');

const router = express.Router();
const accountController = require('../controllers/accountController');

router.get('/statement', accountController.statement);
router.get('/pl/sports', accountController.sportsPl);
router.get('/pl/events', accountController.eventsPl);
module.exports = router;
