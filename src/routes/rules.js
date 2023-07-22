const express = require('express');

const router = express.Router();
const rulesController = require('../controllers/rulesController');

router.post('/', rulesController.addrules);
router.post('/addsubrules', rulesController.addsubrules);
router.delete('/', rulesController.deleterules);
router.get('/', rulesController.fetchrules);

module.exports = router;
