const express = require('express');

const router = express.Router();
const st8Controller = require('../controllers/st8Controller');

router.get('/transactions', st8Controller.getTransaction);
router.get('/balance', st8Controller.getBalance);
router.get('/getCategories', st8Controller.getCategoryList);

router.post('/', st8Controller.signBody);
router.post('/launch', st8Controller.launchGame);
router.post('/deposit', st8Controller.deposit);
router.post('/withdraw', st8Controller.withdraw);
router.post('/transfer', st8Controller.transfer);


module.exports = router;
