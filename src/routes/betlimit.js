const express = require('express');

const router = express.Router();
const betlimitController = require('../controllers/betlimitController');

router.post('/', betlimitController.addBetlimit);
router.get('/', betlimitController.fetchBetlimits);
router.delete('/', betlimitController.deleteBetlimit);

module.exports = router;
