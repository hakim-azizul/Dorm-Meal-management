import { User } from "../models/User.js";
import { MealSelection } from "../models/MealSelection.js";
import { Attendance } from "../models/Attendance.js";

const DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Dynamic helper to calculate Saturday weekStartDate for ANY given date
const getWeekStartDateForDate = (targetDateStr) => {
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const day = targetDate.getDay(); // 0 is Sun, 6 is Sat
  const diffToSaturday = day === 6 ? 0 : -(day + 1);
  const saturday = new Date(targetDate);
  saturday.setDate(targetDate.getDate() + diffToSaturday);
  return saturday.toISOString().split("T")[0];
};

// GET /api/chef/today-list
export const getTodayList = async (req, res) => {
  try {
    const { mealType, date, day } = req.query;
    const sessionMeal = mealType || "lunch";

    // Determine target date and dynamic weekStartDate
    const todayDate = date || new Date().toISOString().split("T")[0];
    const dayKey = day || DAY_MAP[new Date(todayDate).getDay()];
    const weekStartDate = getWeekStartDateForDate(todayDate);

    // 1. Fetch all registered students
    const allStudents = await User.find({ role: "student" }).sort({ room: 1, name: 1 });

    // 2. Fetch today's existing attendance records
    const attendanceRecords = await Attendance.find({ date: todayDate, mealType: sessionMeal });
    const attendanceMap = new Map();
    attendanceRecords.forEach((att) => {
      attendanceMap.set(att.studentId.toString(), att.status);
    });

    // 3. For Breakfast and Dinner: return all active (non-blocked) students
    if (sessionMeal !== "lunch") {
      const studentList = allStudents.map((stu) => ({
        id: stu._id,
        name: stu.name,
        room: stu.room,
        email: stu.email,
        isBlocked: stu.isBlocked,
        isRedFlagged: stu.isRedFlagged,
        mealType: sessionMeal,
        preSelected: true, // Fixed for all
        attendanceStatus: attendanceMap.get(stu._id.toString()) || "unmarked",
      }));

      return res.status(200).json({
        success: true,
        date: todayDate,
        day: dayKey,
        mealType: sessionMeal,
        totalEligible: studentList.length,
        students: studentList,
      });
    }

    // 4. FOR LUNCH: STRICT PRE-SELECTION REQUIREMENT
    const selections = await MealSelection.find({ weekStartDate });
    const studentSelectionMap = new Map();
    selections.forEach((sel) => {
      studentSelectionMap.set(sel.studentId.toString(), sel.lunchSelections?.[dayKey]);
    });

    const eligibleLunchStudents = allStudents
      .filter((stu) => {
        // Must explicitly have lunchSelections[today] === true
        const isSelected = studentSelectionMap.get(stu._id.toString());
        return isSelected === true;
      })
      .map((stu) => ({
        id: stu._id,
        name: stu.name,
        room: stu.room,
        email: stu.email,
        isBlocked: stu.isBlocked,
        isRedFlagged: stu.isRedFlagged,
        mealType: "lunch",
        preSelected: true,
        attendanceStatus: attendanceMap.get(stu._id.toString()) || "unmarked",
      }));

    return res.status(200).json({
      success: true,
      date: todayDate,
      day: dayKey,
      mealType: "lunch",
      totalEligible: eligibleLunchStudents.length,
      students: eligibleLunchStudents,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/chef/check-in
export const checkInStudent = async (req, res) => {
  try {
    const { studentId, date, mealType, status } = req.body;

    if (!studentId || !mealType || !status) {
      return res.status(400).json({
        success: false,
        message: "studentId, mealType, and status ('present' | 'absent') are required",
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const checkInDate = date || new Date().toISOString().split("T")[0];

    // Record or update attendance
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, date: checkInDate, mealType },
      { studentId, date: checkInDate, mealType, status },
      { upsert: true, new: true }
    );

    // ABSENCE & RED-FLAG LOGIC:
    if (mealType === "lunch") {
      if (status === "absent") {
        student.isRedFlagged = true;
      } else if (status === "present") {
        student.isRedFlagged = false;
      }
      await student.save();
    } else if (status === "present" && student.isRedFlagged) {
      // Checking in with chef on any subsequent meal clears the red flag
      student.isRedFlagged = false;
      await student.save();
    }

    return res.status(200).json({
      success: true,
      message: `Student marked as ${status.toUpperCase()}. ${
        student.isRedFlagged
          ? "RED-FLAG alert active on student account."
          : "Student attendance verified. No active red-flag."
      }`,
      attendance,
      student: {
        id: student._id,
        name: student.name,
        isRedFlagged: student.isRedFlagged,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};