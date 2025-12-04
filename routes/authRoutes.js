// src/routes/authRoutes.js
const express = require("express");
const { registerUser, loginUser, logoutUser } = require("../controllers/authController.js");

const router = express.Router();

// Register (Employee / Manager)
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);
router.post("/logout", logoutUser);
module.exports = router;
