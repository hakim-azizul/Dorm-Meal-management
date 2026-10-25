import mongoose from "mongoose";

const lunchSelectionsSchema = new mongoose.Schema(
  {
    sat: { type: Boolean, default: true },
    sun: { type: Boolean, default: true },
    mon: { type: Boolean, default: true },
    tue: { type: Boolean, default: true },
    wed: { type: Boolean, default: true },
    thu: { type: Boolean, default: true },
    fri: { type: Boolean, default: false },
  },
  { _id: false }
);

const mealSelectionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStartDate: {
      type: String, // e.g. "2026-10-24" (Saturday week start ISO format)
      required: true,
      index: true,
    },
    lunchSelections: {
      type: lunchSelectionsSchema,
      default: () => ({}),
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    // 1-year data retention strategy (TTL index)
    createdAt: {
      type: Date,
      default: Date.now,
      expires: "365d",
    },
  },
  { timestamps: true }
);

// Prevent duplicate selections per student per week
mealSelectionSchema.index({ studentId: 1, weekStartDate: 1 }, { unique: true });

export const MealSelection = mongoose.model("MealSelection", mealSelectionSchema);
