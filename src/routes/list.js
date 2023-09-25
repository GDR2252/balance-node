const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const listController = require('../controllers/listController');
const st8Controller = require('../controllers/st8Controller');

router.get('/st8games', auth, st8Controller.getGames);
router.get('/sportsList', auth, listController.sportsList);
router.get('/sideMenuList', auth, listController.sideMenuList);
router.get('/getEventList', auth, listController.getEventList);
router.get('/getEventSportsList', auth, listController.getEventSportsList);
router.get('/getMarketList', auth, listController.getMarketList);
router.get('/getSearchEvent', auth, listController.getSearchEventList);

module.exports = router;
