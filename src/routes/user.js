const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.createUser);
router.get('/', userController.listUser);
router.post('/update', userController.updateUser);
router.delete('/', userController.deleteUser);

module.exports = router;
