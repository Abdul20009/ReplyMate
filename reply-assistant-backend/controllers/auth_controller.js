const jwt = require("jsonwebtoken");
const User = require("../models/user_model");

// ─── Helper: generate signed JWT ───────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};   

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // 3. Create user (password hashing happens automatically in the model)
    const user = await User.create({ email, password });

    // 4. Generate token
    const token = generateToken(user._id);

    // 5. Send response
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: { id: user._id, email: user.email, plan: user.plan },
        token,
      },
    });
  } catch (error) {
    console.error(error);
    console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @route   POST /api/auth/login
// @desc    Log in an existing user
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Generate token
    const token = generateToken(user._id);

    // 5. Send response
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        user: { id: user._id, email: user.email, plan: user.plan },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { signup, login };
