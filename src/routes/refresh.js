const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const refreshController = require('../controllers/refreshtokenController');

router.get('/', auth, refreshController.handleRefreshToken);

module.exports = router;
