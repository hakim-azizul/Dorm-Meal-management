import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export type Role = "student" | "admin" | "chef";

export interface SessionPayload {
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

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "super_secret_hostel_meal_jwt_key_2026_production_safe";

const encodedSecret = new TextEncoder().encode(JWT_SECRET_STRING);

/**
 * Sign a JWT token containing user session payload (Edge and Node compatible)
 */
export async function signJwtToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedSecret);
}

/**
 * Verify a JWT token and extract the session payload
 */
export async function verifyJwtToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
