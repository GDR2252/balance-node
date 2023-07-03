const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const listController = require('../controllers/listController');

router.post('/sportsList', auth, listController.sportsList);
router.post('/sideMenuList', auth, listController.sideMenuList);

module.exports = router;
