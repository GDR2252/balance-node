const express = require('express');

const router = express.Router();
const st8Controller = require('../controllers/st8Controller');
const { auth } = require('../middleware/authentication');

router.post('/', st8Controller.signBody);
router.get('/games', auth, st8Controller.getGames);
router.post('/launch', st8Controller.launchGame);
router.post('/balance', st8Controller.getBalance);
router.post('/deposit', st8Controller.deposit);
router.post('/withdraw', st8Controller.withdraw);
router.post('/transfer', st8Controller.transfer);


module.exports = router;
