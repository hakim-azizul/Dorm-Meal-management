"use server";

import { getDatabase } from "@/lib/mongodb";
import { logAuditEvent, AuditLogEntry, AuditLogActor } from "@/lib/audit";

export { logAuditEvent };
export type { AuditLogEntry, AuditLogActor };

export interface FormattedAuditLog {
  id: string;
  _id: string;
  action: string;
  performedBy: AuditLogActor;
  targetId?: string;
  targetEmail?: string;
  details?: Record<string, unknown>;
  timestamp: string | Date;
}

/**
 * Server Action to fetch recent administrative audit logs
 */
export async function getAuditLogsAction(limit = 50): Promise<{ success: boolean; logs: FormattedAuditLog[] }> {
  try {
    const db = await getDatabase();
    const logs = await db
      .collection("auditlogs")
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return {
      success: true,
      logs: logs.map((l) => ({
        id: l._id.toString(),
        _id: l._id.toString(),
        action: (l.action as string) || "UNKNOWN_ACTION",
        performedBy: (l.performedBy as AuditLogActor) || { role: "admin", name: "System Admin" },
        targetId: l.targetId as string | undefined,
        targetEmail: l.targetEmail as string | undefined,
        details: (l.details as Record<string, unknown>) || undefined,
        timestamp: (l.timestamp as Date) || new Date(),
      })),
    };
  } catch (error: unknown) {
    console.error("getAuditLogsAction error:", error);
    return { success: false, logs: [] };
  }
}
