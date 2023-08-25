const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const listController = require('../controllers/listController');

router.get('/sportsList', auth, listController.sportsList);
router.get('/sideMenuList', auth, listController.sideMenuList);
router.get('/getEventList', auth, listController.getEventList);
router.get('/getMarketList', auth, listController.getMarketList);
module.exports = router;
