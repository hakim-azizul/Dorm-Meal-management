"use server";

import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import {
  checkRateLimit,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
  logAuditEvent,
} from "@/lib/audit";

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

    // 1. Security Check: Rate Limiting & Brute-Force Protection
    const rateLimit = await checkRateLimit(email);
    if (rateLimit.isBlocked) {
      return {
        success: false,
        message: rateLimit.message || "Account is temporarily locked. Please try again later.",
      };
    }

    const db = await getDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      const fail = await recordFailedLoginAttempt(email);
      if (fail.isNowLocked) {
        return {
          success: false,
          message: fail.message || "Account locked for 15 minutes due to multiple failed attempts.",
        };
      }
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
      const fail = await recordFailedLoginAttempt(email);
      if (fail.isNowLocked) {
        return {
          success: false,
          message: fail.message || "Account locked for 15 minutes due to multiple failed attempts.",
        };
      }
      return {
        success: false,
        message:
          fail.attemptsLeft <= 2
            ? `Invalid email or password. (${fail.attemptsLeft} attempt(s) remaining before security lockout).`
            : "Invalid email or password.",
      };
    }

    // 2. Clear failed attempts counter upon successful authentication
    await clearFailedLoginAttempts(email);

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

    // Set server-side session cookie for edge middleware and SSR route protection
    try {
      const cookieStore = await cookies();
      cookieStore.set("meal_session", JSON.stringify(userSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (cookieError) {
      console.warn("Could not set session cookie:", cookieError);
    }

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
 * Direct Database Action to Logout and clear session cookie
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("meal_session");
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Direct Database Action to Get Current Session from server-side cookie
 */
export async function getSessionAction(): Promise<UserSessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("meal_session");
    if (!sessionCookie?.value) return null;
    return JSON.parse(sessionCookie.value) as UserSessionData;
  } catch {
    return null;
  }
}

/**
 * Direct Database Action for User to Update / Change Their Password
 * Securely hashes new password with bcryptjs and flips isPasswordReset to false
 */
export async function updatePasswordAction(payload: {
  userId: string;
  currentPassword?: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { userId, currentPassword, newPassword } = payload;

    if (!userId) {
      return { success: false, message: "User ID is required." };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters long." };
    }

    const db = await getDatabase();
    const objId = new ObjectId(userId);
    const user = await db.collection("users").findOne({ _id: objId });

    if (!user) {
      return { success: false, message: "User account not found." };
    }

    // If current password provided, verify it
    if (currentPassword && user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return { success: false, message: "Current password does not match our records." };
      }
    } else if (!user.isPasswordReset && user.password) {
      // If user had already changed their password before, require current password
      return { success: false, message: "Current password is required to set a new password." };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.collection("users").updateOne(
      { _id: objId },
      {
        $set: {
          password: hashedPassword,
          isPasswordReset: false,
          updatedAt: new Date(),
        },
      }
    );

    // Update session cookie if active
    try {
      const cookieStore = await cookies();
      const existingCookie = cookieStore.get("meal_session");
      if (existingCookie?.value) {
        const parsed = JSON.parse(existingCookie.value);
        if (parsed.id === userId) {
          cookieStore.set(
            "meal_session",
            JSON.stringify({ ...parsed, isPasswordReset: false }),
            {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            }
          );
        }
      }
    } catch {
      // Non-critical if cookie cannot be updated immediately
    }

    return {
      success: true,
      message: "Password updated successfully. Default password is no longer active.",
    };
  } catch (error: any) {
    console.error("Direct MongoDB updatePasswordAction Error:", error);
    return {
      success: false,
      message: error.message || "Failed to update password in database.",
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

    // Log administrative action to audit trail
    await logAuditEvent({
      action: "CREATE_USER",
      targetId: insertedId,
      targetEmail: email,
      details: { name, role, room: doc.room, shift: doc.shift },
    });

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
    const existing = await db.collection("users").findOne({ _id: objId });

    await db.collection("users").deleteOne({ _id: objId });
    await db.collection("mealselections").deleteMany({ studentId: objId });
    await db.collection("attendances").deleteMany({ studentId: objId });

    // Log administrative deletion
    await logAuditEvent({
      action: "DELETE_USER",
      targetId: userId,
      targetEmail: existing?.email,
      details: { name: existing?.name, role: existing?.role },
    });

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
    const targetUser = await db.collection("users").findOne({ _id: objId });
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

    // Log administrative password reset
    await logAuditEvent({
      action: "RESET_PASSWORD",
      targetId: userId,
      targetEmail: targetUser?.email,
      details: { defaultPasswordRestored: true, userName: targetUser?.name },
    });

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
