"use server";

import { getDatabase } from "@/lib/mongodb";
import { logAuditEvent, AuditLogEntry } from "@/lib/audit";

export { logAuditEvent };
export type { AuditLogEntry };

/**
 * Server Action to fetch recent administrative audit logs
 */
export async function getAuditLogsAction(limit = 50): Promise<{ success: boolean; logs: any[] }> {
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
        ...l,
        _id: l._id.toString(),
        id: l._id.toString(),
      })),
    };
  } catch (error: any) {
    console.error("getAuditLogsAction error:", error);
    return { success: false, logs: [] };
  }
}
