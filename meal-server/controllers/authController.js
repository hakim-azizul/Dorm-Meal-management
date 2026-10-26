import { User } from "../models/User.js";
import bcrypt from "bcryptjs";

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        room: user.room,
        shift: user.shift,
        isBlocked: user.isBlocked,
        isRedFlagged: user.isRedFlagged,
        penaltyReason: user.penaltyReason,
        isPasswordReset: user.isPasswordReset ?? false,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ success: false, message: "User ID and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If currentPassword provided, verify it (unless user was newly created/reset and updating)
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.isPasswordReset = false; // Successfully updated their personal password!
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPasswordReset: false,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me/:userId
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        room: user.room,
        shift: user.shift,
        isBlocked: user.isBlocked,
        isRedFlagged: user.isRedFlagged,
        penaltyReason: user.penaltyReason,
        isPasswordReset: user.isPasswordReset ?? false,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
