const express = require('express');

const router = express.Router();
const st8Controller = require('../controllers/st8Controller');

router.post('/', st8Controller.signBody);

module.exports = router;
