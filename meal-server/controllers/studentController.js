import { User } from "../models/User.js";
import { MealSelection } from "../models/MealSelection.js";
import { SystemConfig } from "../models/SystemConfig.js";

/**
 * Calculates the week start date (Saturday) for the current active operating week.
 * - On Saturday (6): today
 * - On Sun-Fri (0-5): past Saturday
 */
export const getCurrentWeekStartDate = (targetDate) => {
  const now = targetDate ? new Date(targetDate) : new Date();
  const day = now.getDay(); // 0 is Sun, 6 is Sat
  const diffToSaturday = day === 6 ? 0 : -(day + 1);
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + diffToSaturday);
  return saturday.toISOString().split("T")[0];
};

/**
 * Calculates the target week start date (Saturday) for student meal selections:
 * - On Friday (5): Selection window is open for the UPCOMING week cycle (starts tomorrow, Saturday).
 * - On Sat-Thu (0-4, 6): Refers to the current active operating week.
 */
export const getSelectionWeekStartDate = (targetDate) => {
  const now = targetDate ? new Date(targetDate) : new Date();
  const day = now.getDay();
  if (day === 5) {
    const upcomingSat = new Date(now);
    upcomingSat.setDate(now.getDate() + 1);
    return upcomingSat.toISOString().split("T")[0];
  }
  return getCurrentWeekStartDate(now);
};

// GET /api/meals/my-selection
export const getMySelection = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.headers["x-user-id"];
    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId is required" });
    }

    const user = await User.findById(studentId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const config = await SystemConfig.findOne({ key: "global_settings" });
    const isGlobalLocked = config ? config.isGlobalLocked : false;
    const isFriday = new Date().getDay() === 5;

    // Active operating week cycle (Saturday through Friday)
    const defaultWeek = getCurrentWeekStartDate();
    const weekStartDate = req.query.weekStartDate || defaultWeek;
    let selection = await MealSelection.findOne({ studentId, weekStartDate });

    if (!selection) {
      selection = {
        studentId,
        weekStartDate,
        lunchSelections: { sat: true, sun: true, mon: true, tue: true, wed: true, thu: true, fri: false },
        isLocked: isGlobalLocked || user.isBlocked,
      };
    }

    return res.status(200).json({
      success: true,
      student: {
        id: user._id,
        name: user.name,
        email: user.email,
        room: user.room,
        isBlocked: user.isBlocked,
        isRedFlagged: user.isRedFlagged,
        penaltyReason: user.penaltyReason,
      },
      isGlobalLocked,
      isFriday,
      weekStartDate,
      selection,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/meals/select
export const selectLunch = async (req, res) => {
  try {
    const { studentId, weekStartDate, lunchSelections } = req.body;

    if (!studentId || !lunchSelections) {
      return res.status(400).json({ success: false, message: "studentId and lunchSelections are required" });
    }

    // 1. Validate User & Block status
    const user = await User.findById(studentId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: `Meal selection blocked: Your privileges are suspended due to: ${user.penaltyReason || "Disciplinary Notice"}.`,
      });
    }

    // 2. Validate Global Lock
    const config = await SystemConfig.findOne({ key: "global_settings" });
    if (config?.isGlobalLocked) {
      return res.status(403).json({
        success: false,
        message: "ADMIN LOCKED: All meal selections are currently frozen by administration.",
      });
    }

    // 3. Upsert Selection for active operating week
    const targetWeek = weekStartDate || getCurrentWeekStartDate();
    const updated = await MealSelection.findOneAndUpdate(
      { studentId, weekStartDate: targetWeek },
      {
        studentId,
        weekStartDate: targetWeek,
        lunchSelections,
        isLocked: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Meal preferences saved successfully.",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
