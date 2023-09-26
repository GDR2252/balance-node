const express = require('express');

const router = express.Router();
const st8Controller = require('../controllers/st8Controller');

router.post('/', st8Controller.signBody);
router.post('/launch', st8Controller.launchGame);
router.get('/balance', st8Controller.getBalance);
router.post('/deposit', st8Controller.deposit);
router.post('/withdraw', st8Controller.withdraw);
router.post('/transfer', st8Controller.transfer);


module.exports = router;
