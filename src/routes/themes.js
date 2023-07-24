const express = require('express');

const router = express.Router();
const themesController = require('../controllers/themesController');

router.post('/', themesController.addThemes);
router.get('/', themesController.fetchThemes);
router.post('/update', themesController.updateThemes);
router.delete('/', themesController.deleteThemes);

module.exports = router;
