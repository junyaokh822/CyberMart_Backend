import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Cart from "../models/Cart.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * generateToken
 * Creates a signed JWT containing the user's ID.
 * Token expires in 30 days — used for persistent login sessions.
 * @param {string} id - MongoDB user _id
 * @returns {string} signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @route   POST /api/auth/register
// @desc    Register a new user and create their empty cart
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Prevent duplicate accounts
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password before storing (salt rounds = 10 for good security/performance balance)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "customer",
    });

    // Create an empty cart for the new user immediately upon registration
    await Cart.create({
      userId: user._id,
      items: [],
      totalPrice: 0,
    });

    // Return user data + token so the frontend can log them in right away
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and return JWT token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Use same error message for both cases to prevent email enumeration
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare submitted password against the stored bcrypt hash
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/auth/profile
// @desc    Get the currently logged-in user's profile
// @access  Private
router.get("/profile", protect, async (req, res) => {
  try {
    // req.user is already attached by the protect middleware
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Profile error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update the logged-in user's name or email
// @access  Private
router.put("/profile", protect, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Prevent stealing another user's email
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user._id }, // exclude current user from check
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Update and return the new user document (without password)
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, email },
      { new: true, runValidators: true }, // new: true returns updated doc
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/auth/password
// @desc    Change the logged-in user's password
// @access  Private
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate both fields are provided
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Fetch user WITH password (select("-password") is used elsewhere but not here)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify the user knows their current password before allowing a change
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash and save the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
