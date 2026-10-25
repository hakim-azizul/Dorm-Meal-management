import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // e.g. "2026-10-26"
      required: true,
      index: true,
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: true,
    },
    // 1-year data retention cleanup strategy
    createdAt: {
      type: Date,
      default: Date.now,
      expires: "365d",
    },
  },
  { timestamps: true }
);

// Unique index to ensure one record per student, per date, per meal
attendanceSchema.index({ studentId: 1, date: 1, mealType: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
