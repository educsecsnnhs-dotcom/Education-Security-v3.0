// controllers/authController.js
const User = require("../models/User");
const { encrypt, decrypt } = require("../utils/caesar");

/**
 * Register - default role is Student. (SuperAdmin seeds separately)
 */
exports.register = async (req, res) => {
  try {
    const { fullName, username, password, lrn } = req.body;
    if (!username || !password) return res.status(400).json({ message: "username & password required" });
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "Username already taken" });

    const hashed = encrypt(password); // Caesar cipher
    const user = new User({ fullName, username, password: hashed, lrn, role: "Student" });
    await user.save();
    res.status(201).json({ message: "User registered", user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Registration error", error: err.message });
  }
};

/**
 * Login - store minimal user info in session (no password)
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (decrypt(user.password) !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Minimal session payload (don't store password)
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      lrn: user.lrn,
    };

    res.json({ message: "Login successful", user: req.session.user });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

/**
 * Logout
 */
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
};

/**
 * Get current session user
 */
exports.me = (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ message: "Unauthorized" });
  res.json(req.session.user);
};
