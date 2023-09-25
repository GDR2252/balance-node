const express = require('express');

const router = express.Router();
const listController = require('../controllers/listController');

router.get('/sportsList', listController.sportsList);
router.get('/sideMenuList', listController.sideMenuList);
router.get('/getEventList', listController.getEventList);
router.get('/getEventSportsList', listController.getEventSportsList);
router.get('/getMarketList', listController.getMarketList);
router.get('/getSearchEvent', listController.getSearchEventList);

module.exports = router;
