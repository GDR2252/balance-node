const express = require('express');
const multer = require('multer');

const router = express.Router();
const themesController = require('../controllers/themesController');

const inMemoryStorage = multer.memoryStorage();
const logoUpload = multer({ storage: inMemoryStorage });

router.post('/', logoUpload.fields([{
  name: 'logoUrl', maxCount: 1,
}, {
  name: 'faviconUrl', maxCount: 1,
}]), themesController.addThemes);
router.get('/', themesController.fetchThemes);
router.post('/update', themesController.updateThemes);
router.delete('/', themesController.deleteThemes);

module.exports = router;
