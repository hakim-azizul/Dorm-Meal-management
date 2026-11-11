import type { UserSessionData } from "@/app/actions/authActions";
import type { DayKey } from "@/lib/days";

export type { DayKey } from "@/lib/days";

export type Role = "student" | "admin" | "chef";
export type MealType = "breakfast" | "lunch" | "dinner";

export interface StudentScheduleDay {
  day: DayKey;
  breakfast: { fixed: boolean; name: string };
  dinner: { fixed: boolean; name: string };
  lunch: {
    selected: boolean;
    menuItem: string;
    checkedIn?: boolean;
    isAbsentMissed?: boolean;
  };
}

export interface StudentRecord {
  id: string;
  name: string;
  room: string;
  email: string;
  isBlocked: boolean;
  penaltyReason?: string;
  isRedFlagged: boolean;
  isPasswordReset?: boolean;
  redFlagReason?: string;
  schedule: Record<
    DayKey,
    {
      lunchSelected: boolean;
      lunchCheckedIn: boolean;
      lunchMissed: boolean;
    }
  >;
  attendanceToday: {
    breakfast: boolean;
    lunch: "unmarked" | "present" | "absent";
    dinner: boolean;
  };
}

export interface ChefRecord {
  id: string;
  name: string;
  email: string;
  shift: string;
  isPasswordReset?: boolean;
}

export interface MealAppContextType {
  // Authentication & Session
  currentRole: Role | null;
  currentUser: UserSessionData | null;
  loginWithCredentials: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; role?: Role; message?: string }>;
  changePassword: (
    newPassword: string,
    currentPassword?: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isHydrated: boolean;

  // UI & Responsive Sidebar Controls
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Operating Day & System State
  systemDay: DayKey;
  setSystemDay: (day: DayKey) => void;
  isFriday: boolean;
  todayDateFormatted: string;

  // Global Lock
  isGlobalLocked: boolean;
  toggleGlobalLock: () => Promise<void>;

  // Student Actions
  studentSchedule: StudentScheduleDay[];
  toggleStudentLunch: (day: DayKey) => Promise<{ success: boolean; message: string }>;
  refreshStudentData: () => Promise<void>;

  // Admin Actions
  students: StudentRecord[];
  chefs: ChefRecord[];
  toggleStudentPenalty: (studentId: string, reason?: string) => Promise<void>;
  adminOverrideStudentLunch: (studentId: string, day: DayKey) => Promise<void>;
  addNewStudent: (student: {
    name: string;
    room: string;
    email: string;
  }) => Promise<{ success: boolean; message?: string }>;
  deleteStudent: (studentId: string) => Promise<void>;
  addNewChef: (chef: {
    name: string;
    email: string;
    shift: string;
  }) => Promise<{ success: boolean; message?: string }>;
  deleteChef: (chefId: string) => Promise<void>;
  adminResetPassword: (userId: string) => Promise<{ success: boolean; message: string }>;
  refreshAdminRoster: () => Promise<void>;

  // Chef Attendance Actions
  markChefBreakfast: (studentId: string) => Promise<void>;
  markChefDinner: (studentId: string) => Promise<void>;
  markChefLunchStatus: (
    studentId: string,
    status: "present" | "absent",
  ) => Promise<{ success: boolean; message: string }>;
}
