/** Shared type contracts for the warden (admin) dashboard building blocks. */
export type AdminTab = "students" | "chefs" | "reports";

export type StudentStatusFilter = "all" | "penalized" | "redflags" | "active";

export interface PasswordResetRequest {
  id: string;
  name: string;
  role: string;
}
