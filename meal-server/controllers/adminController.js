import { User } from "../models/User.js";
import { MealSelection } from "../models/MealSelection.js";
import { SystemConfig } from "../models/SystemConfig.js";
import { getCurrentWeekStartDate } from "./studentController.js";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "Dorm@1234";

// POST /api/admin/toggle-global-lock
export const toggleGlobalLock = async (req, res) => {
  try {
    let config = await SystemConfig.findOne({ key: "global_settings" });
    if (!config) {
      config = new SystemConfig({ key: "global_settings", isGlobalLocked: false });
    }

    if (typeof req.body.isLocked === "boolean") {
      config.isGlobalLocked = req.body.isLocked;
    } else {
      config.isGlobalLocked = !config.isGlobalLocked;
    }

    await config.save();

    return res.status(200).json({
      success: true,
      isGlobalLocked: config.isGlobalLocked,
      message: `Global selection lock is now ${config.isGlobalLocked ? "ACTIVATED (Locked)" : "DEACTIVATED (Unlocked)"}.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/toggle-block
export const toggleBlockStudent = async (req, res) => {
  try {
    const { studentId, isBlocked, reason } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    student.isBlocked = typeof isBlocked === "boolean" ? isBlocked : !student.isBlocked;
    student.penaltyReason = student.isBlocked ? (reason || "Administrative disciplinary policy violation") : undefined;

    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student meal privileges ${student.isBlocked ? "BLOCKED" : "UNBLOCKED"}.`,
      student: {
        id: student._id,
        name: student.name,
        isBlocked: student.isBlocked,
        penaltyReason: student.penaltyReason,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/override-meal
export const overrideStudentMeal = async (req, res) => {
  try {
    const { studentId, weekStartDate, day, selected, lunchSelections } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const targetWeek = weekStartDate || getCurrentWeekStartDate();
    let record = await MealSelection.findOne({ studentId, weekStartDate: targetWeek });

    if (!record) {
      record = new MealSelection({
        studentId,
        weekStartDate: targetWeek,
        lunchSelections: { sat: true, sun: true, mon: true, tue: true, wed: true, thu: true, fri: false },
      });
    }

    if (lunchSelections) {
      record.lunchSelections = { ...record.lunchSelections, ...lunchSelections };
    } else if (day && typeof selected === "boolean") {
      record.lunchSelections[day] = selected;
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: `Admin override applied for ${student.name}.`,
      data: record,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const roleFilter = req.query.role;
    const query = roleFilter ? { role: roleFilter } : {};
    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/users
export const createUser = async (req, res) => {
  try {
    const { name, email, role, room, shift } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    // Hash the default password "Dorm@1234"
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "student",
      room: room?.trim(),
      shift: shift?.trim(),
      isPasswordReset: true,
      isBlocked: false,
      isRedFlagged: false,
    });

    // If student, create initial weekly meal selection
    if (newUser.role === "student") {
      await MealSelection.create({
        studentId: newUser._id,
        weekStartDate: getCurrentWeekStartDate(),
        lunchSelections: { sat: true, sun: true, mon: true, tue: true, wed: true, thu: true, fri: false },
      });
    }

    const userObj = newUser.toObject();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: "User account created successfully with default password 'Dorm@1234'",
      user: userObj,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/reset-password
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(DEFAULT_PASSWORD, salt);
    user.isPasswordReset = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Password for ${user.name} has been reset to '${DEFAULT_PASSWORD}' successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPasswordReset: user.isPasswordReset,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(id);
    if (user.role === "student") {
      await MealSelection.deleteMany({ studentId: id });
    }

    return res.status(200).json({
      success: true,
      message: `User ${user.name} removed successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
