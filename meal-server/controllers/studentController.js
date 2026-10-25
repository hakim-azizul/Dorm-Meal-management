import { User } from "../models/User.js";
import { MealSelection } from "../models/MealSelection.js";
import { SystemConfig } from "../models/SystemConfig.js";

// Helper: Get Saturday week start date string YYYY-MM-DD for any date
export const getCurrentWeekStartDate = (targetDate) => {
  const now = targetDate ? new Date(targetDate) : new Date();
  const day = now.getDay(); // 0 is Sun, 6 is Sat
  const diffToSaturday = day === 6 ? 0 : -(day + 1);
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + diffToSaturday);
  return saturday.toISOString().split("T")[0];
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

    const weekStartDate = req.query.weekStartDate || getCurrentWeekStartDate();
    let selection = await MealSelection.findOne({ studentId, weekStartDate });

    if (!selection) {
      selection = {
        studentId,
        weekStartDate,
        lunchSelections: { sat: true, sun: true, mon: true, tue: true, wed: true, thu: true, fri: false },
        isLocked: isGlobalLocked || user.isBlocked,
      };
    }

    // Fixed breakfast and dinner details
    const fixedMeals = {
      breakfast: { fixed: true, note: "Standard continental breakfast included daily" },
      dinner: { fixed: true, note: "Standard hot dinner meal included daily" },
    };

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
      isFriday: new Date().getDay() === 5,
      selection,
      fixedMeals,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/meals/select
export const selectLunch = async (req, res) => {
  try {
    const { studentId, weekStartDate, lunchSelections, simulateFriday } = req.body;

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
        message: "Admin Global Lock is active. Weekly selections cannot be modified at this time.",
      });
    }

    // 3. Validate Friday-Only Policy (getDay() === 5 is Friday)
    const isActuallyFriday = new Date().getDay() === 5;
    const isDevMode = process.env.NODE_ENV === "development";
    const isFridayEligible = isActuallyFriday || (isDevMode && simulateFriday === true);

    if (!isFridayEligible) {
      return res.status(400).json({
        success: false,
        message: "RESTRICTION: Lunch selection can ONLY be selected or modified on FRIDAYS.",
      });
    }

    // 4. Upsert Selection
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
      message: "Lunch preferences updated successfully.",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};