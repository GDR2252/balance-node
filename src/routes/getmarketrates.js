const express = require('express');

const router = express.Router();
const migrationController = require('../controllers/migratedatatofirebase');

router.post('/', migrationController.fetchmarketrates);
router.post('/sync', migrationController.syncfirebase);

module.exports = router;
