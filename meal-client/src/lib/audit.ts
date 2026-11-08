import { getDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";

export interface AuditLogActor {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
}

export interface AuditLogEntry {
  action: string;
  performedBy: AuditLogActor;
  targetId?: string;
  targetEmail?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Record an administrative or security audit event in MongoDB
 */
export async function logAuditEvent(entry: {
  action: string;
  targetId?: string;
  targetEmail?: string;
  details?: Record<string, unknown>;
  performedBy?: AuditLogActor;
}) {
  try {
    const db = await getDatabase();

    let actor = entry.performedBy;
    if (!actor) {
      try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("meal_session");
        if (sessionCookie?.value) {
          const verified = await verifyJwtToken(sessionCookie.value);
          if (verified) {
            actor = {
              id: verified.id,
              email: verified.email,
              role: verified.role,
              name: verified.name,
            };
          }
        }
      } catch {
        // Fallback actor if outside cookie context
      }
    }

    const logDoc: AuditLogEntry = {
      action: entry.action,
      performedBy: actor || { role: "admin", name: "System Admin" },
      targetId: entry.targetId,
      targetEmail: entry.targetEmail,
      details: entry.details,
      timestamp: new Date(),
    };

    await db.collection("auditlogs").insertOne(logDoc);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15-minute security lockout

/**
 * Check if an email address is currently rate-limited/locked
 */
export async function checkRateLimit(email: string): Promise<{ isBlocked: boolean; message?: string }> {
  try {
    const db = await getDatabase();
    const record = await db.collection("login_attempts").findOne({ email });

    if (!record) {
      return { isBlocked: false };
    }

    const now = Date.now();

    if (record.lockedUntil && new Date(record.lockedUntil as string | number | Date).getTime() > now) {
      const remainingMinutes = Math.ceil(
        (new Date(record.lockedUntil as string | number | Date).getTime() - now) / 60000
      );
      return {
        isBlocked: true,
        message: `Too many failed login attempts. Account temporarily locked for security. Please try again in ${remainingMinutes} minute(s).`,
      };
    }

    // Reset expired lockout
    if (record.lockedUntil && new Date(record.lockedUntil as string | number | Date).getTime() <= now) {
      await db.collection("login_attempts").deleteOne({ email });
      return { isBlocked: false };
    }

    return { isBlocked: false };
  } catch (err) {
    console.error("checkRateLimit error:", err);
    return { isBlocked: false };
  }
}

/**
 * Record a failed login attempt and apply lockout if maximum attempts reached
 */
export async function recordFailedLoginAttempt(
  email: string
): Promise<{ isNowLocked: boolean; attemptsLeft: number; message?: string }> {
  try {
    const db = await getDatabase();
    const now = new Date();

    const existing = await db.collection("login_attempts").findOne({ email });
    const currentAttempts = ((existing?.attempts as number) || 0) + 1;

    if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_WINDOW_MS);
      await db.collection("login_attempts").updateOne(
        { email },
        {
          $set: {
            email,
            attempts: currentAttempts,
            lastAttempt: now,
            lockedUntil,
          },
        },
        { upsert: true }
      );
      return {
        isNowLocked: true,
        attemptsLeft: 0,
        message: "Maximum failed attempts exceeded. Account is locked for 15 minutes for your protection.",
      };
    }

    await db.collection("login_attempts").updateOne(
      { email },
      {
        $set: {
          email,
          attempts: currentAttempts,
          lastAttempt: now,
        },
      },
      { upsert: true }
    );

    return {
      isNowLocked: false,
      attemptsLeft: MAX_LOGIN_ATTEMPTS - currentAttempts,
    };
  } catch (err) {
    console.error("recordFailedLoginAttempt error:", err);
    return { isNowLocked: false, attemptsLeft: 1 };
  }
}

/**
 * Clear failed attempts record upon successful login
 */
export async function clearFailedLoginAttempts(email: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.collection("login_attempts").deleteOne({ email });
  } catch (err) {
    console.error("clearFailedLoginAttempts error:", err);
  }
}
