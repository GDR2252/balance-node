const express = require('express');

const router = express.Router();
const migrationController = require('../controllers/migratedatatofirebase');

router.post('/', migrationController.fetchmarketrates);

module.exports = router;
