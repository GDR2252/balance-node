const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.createUser);
router.get('/', userController.listUser);
router.post('/update', userController.updateUser);
router.delete('/', userController.deleteUser);
router.post('/betlist/getUserBetList', userController.getUserBetList);
router.post('/profitloss/userMarketsProfitloss', userController.userMarketsProfitloss);
router.post('/profitloss/userEventsProfitloss', userController.userEventsProfitloss);
router.post('/profitloss/userSportsProfitloss', userController.userSportsProfitloss);

module.exports = router;
