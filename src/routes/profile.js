const express = require("express");

const router = express.Router();
const { auth } = require("../middleware/authentication");
const userController = require("../controllers/userController");

router.post("/", auth, userController.getProfile);

module.exports = router;
