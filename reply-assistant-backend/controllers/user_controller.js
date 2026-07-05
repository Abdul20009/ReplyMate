const User = require("../models/user_model");

// @route   GET /api/users/me
// @desc    Get the logged-in user's profile
// @access  Private
const getMe = async (req, res) => {
  try {
    // 1. Fetch user, exclude password
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Send response
    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @route   PUT /api/users/me
// @desc    Update onboarding profile (age, occupation, communication style)
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { age, occupation, communicationStyle } = req.body;

    // 1. Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Update only provided fields
    if (age !== undefined) user.profile.age = age;
    if (occupation !== undefined) user.profile.occupation = occupation;
    if (communicationStyle !== undefined)
      user.profile.communicationStyle = communicationStyle;
    user.profile.onboardingCompleted = true;

    await user.save();

    // 3. Send response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user.profile,
    });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getMe, updateProfile };
