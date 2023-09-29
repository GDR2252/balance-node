const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.createUser);
router.get('/', userController.listUser);
router.post('/update', userController.updateUser);
router.delete('/', userController.deleteUser);
router.get('/betlist/getUserBetList', userController.getUserBetList);
router.get('/profitloss/userMarketsProfitloss', userController.userMarketsProfitloss);
router.get('/profitloss/userEventsProfitloss', userController.userEventsProfitloss);
router.get('/profitloss/userSportsProfitloss', userController.userSportsProfitloss);
router.get('/exposureList', userController.getExposureList);

module.exports = router;
