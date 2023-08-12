const express = require('express');

const router = express.Router();
const supportController = require('../controllers/supportController');

router.post('/', supportController.addDetail);
router.post('/update', supportController.updateDetail);
router.delete('/', supportController.deleteDetail);
router.get('/', supportController.fetchDetail);

module.exports = router;
