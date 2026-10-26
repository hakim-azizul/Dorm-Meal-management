import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const userObj = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      room: user.room,
      shift: user.shift,
      isBlocked: !!user.isBlocked,
      penaltyReason: user.penaltyReason,
      isRedFlagged: !!user.isRedFlagged,
      isPasswordReset: user.isPasswordReset ?? false,
    };

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: userObj,
      role: user.role,
    });

    response.cookies.set("meal_session", JSON.stringify(userObj), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Local Next.js /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication service currently unavailable." },
      { status: 500 }
    );
  }
}
