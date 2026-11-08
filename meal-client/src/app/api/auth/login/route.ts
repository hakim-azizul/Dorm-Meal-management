import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { signJwtToken, SessionPayload } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const sessionPayload: SessionPayload = {
      id: user._id.toString(),
      name: user.name as string,
      email: user.email as string,
      role: user.role as SessionPayload["role"],
      room: user.room as string | undefined,
      shift: user.shift as string | undefined,
      isBlocked: Boolean(user.isBlocked),
      penaltyReason: user.penaltyReason as string | undefined,
      isRedFlagged: Boolean(user.isRedFlagged),
      isPasswordReset: user.isPasswordReset ?? false,
    };

    const token = await signJwtToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      token,
      user: sessionPayload,
      role: user.role,
    });

    response.cookies.set("meal_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication service currently unavailable.";
    console.error("Local Next.js /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
