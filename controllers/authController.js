// src/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const blacklist = require("../utils/tokenBlacklist");

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { fullName, name, email, password, role } = req.body;

    const finalName = fullName || name; // support both keys from frontend

    if (!finalName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Full name, email and password are required" });
    }

    // handle role from dropdown: "Employee" / "Manager"
    const validRoles = ["employee", "manager"];
    let normalizedRole = "employee";

    if (role) {
      normalizedRole = String(role).toLowerCase(); // "Employee" -> "employee"
      if (!validRoles.includes(normalizedRole)) {
        return res
          .status(400)
          .json({ message: "Role must be either Employee or Manager" });
      }
    }

    // check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with this email" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const user = await User.create({
      name: finalName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: normalizedRole,
    });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // payload will carry id & role
    const payload = {
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


const logoutUser = (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];

    // Add token to blacklist
    blacklist.add(token);

    return res.json({
      message: "Logout successful"
    });

  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  registerUser,
  loginUser,
  logoutUser
};
