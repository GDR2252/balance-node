const express = require('express');

const router = express.Router();
const { auth } = require('../middleware/authentication');
const verifyJWT = require('../middleware/verifyJWT');
const rulesController = require('../controllers/rulesController');

router.post('/', verifyJWT, rulesController.addrules);
router.post('/update', verifyJWT, rulesController.updaterules);
router.post('/addsubrules', verifyJWT, rulesController.addsubrules);
router.delete('/', verifyJWT, rulesController.deleterules);
router.get('/', auth, rulesController.fetchrules);

module.exports = router;
