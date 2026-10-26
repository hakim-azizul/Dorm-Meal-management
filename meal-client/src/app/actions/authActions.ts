"use server";

import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export type Role = "student" | "admin" | "chef";

export interface UserSessionData {
  id: string;
  name: string;
  email: string;
  role: Role;
  room?: string;
  shift?: string;
  isBlocked?: boolean;
  penaltyReason?: string;
  isRedFlagged?: boolean;
  isPasswordReset?: boolean;
}

export interface LoginActionResult {
  success: boolean;
  role?: Role;
  user?: UserSessionData;
  message?: string;
}

export interface CreateUserActionResult {
  success: boolean;
  message: string;
  user?: UserSessionData;
}

const DEFAULT_PASSWORD = "Dorm@1234";

// Helper: Saturday of current week
export async function getCurrentSaturday(): Promise<string> {
  const now = new Date();
  const day = now.getDay(); // 0 is Sun, 6 is Sat
  const diffToSaturday = day === 6 ? 0 : -(day + 1);
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + diffToSaturday);
  return saturday.toISOString().split("T")[0];
}

/**
 * Direct Database Login Action using Next.js Server Actions
 */
export async function loginAction(
  emailInput: string,
  passwordInput: string
): Promise<LoginActionResult> {
  try {
    const email = emailInput?.trim().toLowerCase();
    const password = passwordInput?.trim();

    if (!email || !password) {
      return {
        success: false,
        message: "Email and password are required.",
      };
    }

    const db = await getDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    if (!user.password) {
      return {
        success: false,
        message: "Account has no password configured. Please contact the administrator.",
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    const userSession: UserSessionData = {
      id: user._id.toString(),
      name: user.name || "User",
      email: user.email,
      role: user.role as Role,
      room: user.room,
      shift: user.shift,
      isBlocked: !!user.isBlocked,
      penaltyReason: user.penaltyReason,
      isRedFlagged: !!user.isRedFlagged,
      isPasswordReset: user.isPasswordReset ?? false,
    };

    return {
      success: true,
      role: user.role as Role,
      user: userSession,
      message: "Login successful.",
    };
  } catch (error: any) {
    console.error("Direct MongoDB Login Action Error:", error);
    return {
      success: false,
      message: "Unable to connect to the authentication service. Please try again.",
    };
  }
}

/**
 * Direct Database Action to Create Chef or Student
 * Automatically sets hashed default password ("Dorm@1234") and isPasswordReset: true
 */
export async function createUserAction(payload: {
  name: string;
  email: string;
  role: "student" | "chef";
  room?: string;
  shift?: string;
}): Promise<CreateUserActionResult> {
  try {
    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase();
    const role = payload.role;
    const room = payload.room?.trim();
    const shift = payload.shift?.trim();

    if (!name || !email) {
      return {
        success: false,
        message: "Name and email are required.",
      };
    }

    const db = await getDatabase();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return {
        success: false,
        message: `An account with email ${email} is already registered.`,
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    const doc: any = {
      name,
      email,
      password: hashedPassword,
      role,
      isPasswordReset: true,
      isBlocked: false,
      isRedFlagged: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (role === "student") {
      doc.room = room || "Room Unassigned";
    } else if (role === "chef") {
      doc.shift = shift || "Morning & Lunch Session";
    }

    const insertResult = await db.collection("users").insertOne(doc);
    const insertedId = insertResult.insertedId.toString();

    // If student, create initial weekly MealSelection
    if (role === "student") {
      const weekStartDate = await getCurrentSaturday();
      await db.collection("mealselections").insertOne({
        studentId: insertResult.insertedId,
        weekStartDate,
        lunchSelections: {
          sat: true,
          sun: true,
          mon: true,
          tue: true,
          wed: true,
          thu: true,
          fri: false,
        },
        isLocked: false,
        createdAt: new Date(),
      });
    }

    const createdUser: UserSessionData = {
      id: insertedId,
      name,
      email,
      role,
      room: doc.room,
      shift: doc.shift,
      isBlocked: false,
      isRedFlagged: false,
      isPasswordReset: true,
    };

    return {
      success: true,
      message: `${role === "chef" ? "Chef" : "Student"} account created successfully with default password "Dorm@1234".`,
      user: createdUser,
    };
  } catch (error: any) {
    console.error("Direct MongoDB Create User Error:", error);
    return {
      success: false,
      message: error.message || "Failed to create user in database.",
    };
  }
}

/**
 * Direct Database Action to Delete User
 */
export async function deleteUserAction(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDatabase();
    const objId = new ObjectId(userId);
    await db.collection("users").deleteOne({ _id: objId });
    await db.collection("mealselections").deleteMany({ studentId: objId });
    await db.collection("attendances").deleteMany({ studentId: objId });
    return { success: true, message: "User deleted successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete user." };
  }
}

/**
 * Direct Database Action to Reset Password back to "Dorm@1234"
 */
export async function resetPasswordAction(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDatabase();
    const objId = new ObjectId(userId);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    await db.collection("users").updateOne(
      { _id: objId },
      {
        $set: {
          password: hashedPassword,
          isPasswordReset: true,
          updatedAt: new Date(),
        },
      }
    );

    return { success: true, message: `Password reset to "${DEFAULT_PASSWORD}".` };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to reset password." };
  }
}

/**
 * Direct Database Action to Fetch all Users
 */
export async function getAllUsersAction(): Promise<{ success: boolean; users: any[] }> {
  try {
    const db = await getDatabase();
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      success: true,
      users: users.map((u) => ({
        ...u,
        _id: u._id.toString(),
        id: u._id.toString(),
      })),
    };
  } catch (error: any) {
    console.error("Direct MongoDB getAllUsersAction Error:", error);
    return { success: false, users: [] };
  }
}
