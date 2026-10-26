import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "admin", "chef"],
      default: "student",
      required: true,
    },
    room: {
      type: String,
      trim: true,
    },
    shift: {
      type: String,
      trim: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isRedFlagged: {
      type: Boolean,
      default: false,
    },
    penaltyReason: {
      type: String,
      trim: true,
    },
    isPasswordReset: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
