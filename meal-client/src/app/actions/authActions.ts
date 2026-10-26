"use server";

import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

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

/**
 * Direct Database Login Action using Next.js Server Actions
 * Queries MongoDB Atlas 'users' collection directly, verifies bcrypt hash,
 * and returns role-based routing details without external port dependency.
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

    // Compare with bcrypt hash
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
