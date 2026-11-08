"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setStoredToken } from "@/lib/api";
import {
  loginAction,
  logoutAction,
  getSessionAction,
  createUserAction,
  deleteUserAction,
  resetPasswordAction,
  updatePasswordAction,
  getAllUsersAction,
  UserSessionData,
  UserListItem,
} from "@/app/actions/authActions";
import {
  toggleGlobalLockAction,
  getGlobalLockStatusAction,
  selectStudentLunchAction,
  getStudentSelectionAction,
  toggleStudentBlockAction,
  adminOverrideLunchAction,
  checkInStudentAction,
  DayKey,
} from "@/app/actions/mealActions";

export type Role = "student" | "admin" | "chef";
export type { DayKey };
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
  schedule: Record<DayKey, {
    lunchSelected: boolean;
    lunchCheckedIn: boolean;
    lunchMissed: boolean;
  }>;
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

interface MealAppContextType {
  // Authentication & Session
  currentRole: Role | null;
  currentUser: UserSessionData | null;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; role?: Role; message?: string }>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isHydrated: boolean;
  backendOnline: boolean;

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
  addNewStudent: (student: { name: string; room: string; email: string }) => Promise<{ success: boolean; message?: string }>;
  deleteStudent: (studentId: string) => Promise<void>;
  addNewChef: (chef: { name: string; email: string; shift: string }) => Promise<{ success: boolean; message?: string }>;
  deleteChef: (chefId: string) => Promise<void>;
  adminResetPassword: (userId: string) => Promise<{ success: boolean; message: string }>;
  refreshAdminRoster: () => Promise<void>;

  // Chef Attendance Actions
  markChefBreakfast: (studentId: string) => Promise<void>;
  markChefDinner: (studentId: string) => Promise<void>;
  markChefLunchStatus: (studentId: string, status: "present" | "absent") => Promise<{ success: boolean; message: string }>;
}

const MealAppContext = createContext<MealAppContextType | undefined>(undefined);

const DAYS: DayKey[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

export function MealAppProvider({ children }: { children: React.ReactNode }) {
  const getInitialDayKey = (): DayKey => {
    const day = new Date().getDay();
    const map: Record<number, DayKey> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
    return map[day] || "mon";
  };

  const [currentUserData, setCurrentUserData] = useState<UserSessionData | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [backendOnline] = useState<boolean>(true);
  const [systemDay, setSystemDay] = useState<DayKey>(getInitialDayKey);
  const [isGlobalLocked, setIsGlobalLocked] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [chefs, setChefs] = useState<ChefRecord[]>([]);

  const currentRole = currentUserData?.role || null;

  // 1. Hydrate User Session safely on client mount without UI flashing
  useEffect(() => {
    let ignore = false;
    async function hydrateSession() {
      try {
        const saved = localStorage.getItem("meal_user_session");
        if (saved) {
          const parsed = JSON.parse(saved) as UserSessionData;
          if (parsed?.id && parsed?.role) {
            if (!ignore) {
              setCurrentUserData(parsed);
              setIsHydrated(true);
            }
            return;
          }
        }
        // Fallback to server-side session cookie if localStorage is empty
        const serverSession = await getSessionAction();
        if (!ignore && serverSession?.id && serverSession?.role) {
          setCurrentUserData(serverSession);
          localStorage.setItem("meal_user_session", JSON.stringify(serverSession));
        }
      } catch {
        localStorage.removeItem("meal_user_session");
      } finally {
        if (!ignore) {
          setIsHydrated(true);
        }
      }
    }
    void hydrateSession();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. Persist session updates
  useEffect(() => {
    if (!isHydrated) return;
    if (currentUserData) {
      localStorage.setItem("meal_user_session", JSON.stringify(currentUserData));
    } else {
      localStorage.removeItem("meal_user_session");
    }
  }, [currentUserData, isHydrated]);

  // 3. Load initial Global Lock state directly via Server Action
  useEffect(() => {
    let ignore = false;
    void getGlobalLockStatusAction().then((locked) => {
      if (!ignore) {
        setIsGlobalLocked(locked);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  // 4. Fetch roster data directly from MongoDB Server Action
  const refreshAdminRoster = useCallback(async () => {
    try {
      const res = await getAllUsersAction();
      if (res.success && Array.isArray(res.users)) {
        const studentUsers = res.users.filter((u: UserListItem) => u.role === "student");
        const chefUsers = res.users.filter((u: UserListItem) => u.role === "chef");

        setStudents(
          studentUsers.map((u: UserListItem) => ({
            id: u._id || u.id || "",
            name: u.name,
            room: u.room || "Room Unassigned",
            email: u.email,
            isBlocked: Boolean(u.isBlocked),
            penaltyReason: u.penaltyReason,
            isRedFlagged: Boolean(u.isRedFlagged),
            isPasswordReset: u.isPasswordReset ?? false,
            schedule: {
              sat: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
              sun: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
              mon: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
              tue: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
              wed: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
              thu: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
              fri: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
            },
            attendanceToday: {
              breakfast: false,
              lunch: "unmarked",
              dinner: false,
            },
          }))
        );

        setChefs(
          chefUsers.map((u: UserListItem) => ({
            id: u._id || u.id || "",
            name: u.name,
            email: u.email,
            shift: u.shift || "Morning & Lunch Session",
            isPasswordReset: u.isPasswordReset ?? false,
          }))
        );
      }
    } catch (err: unknown) {
      console.error("refreshAdminRoster error:", err);
    }
  }, []);

  // 5. Fetch student weekly meal data directly via Server Action
  const refreshStudentData = useCallback(async () => {
    if (!currentUserData?.id || currentUserData.role !== "student") return;
    const studentId = currentUserData.id;

    try {
      const res = await getStudentSelectionAction(studentId);
      if (res.success && res.student) {
        setIsGlobalLocked(Boolean(res.isGlobalLocked));
        const remoteSelections = res.selection?.lunchSelections || {};

        setStudents((prev) => {
          const exists = prev.find((s) => s.id === studentId);
          if (!exists) {
            return [
              ...prev,
              {
                id: res.student!.id,
                name: res.student!.name,
                room: res.student!.room || "Room Unassigned",
                email: res.student!.email,
                isBlocked: Boolean(res.student!.isBlocked),
                penaltyReason: res.student!.penaltyReason,
                isRedFlagged: Boolean(res.student!.isRedFlagged),
                isPasswordReset: res.student!.isPasswordReset ?? false,
                schedule: {
                  sat: { lunchSelected: Boolean(remoteSelections.sat), lunchCheckedIn: false, lunchMissed: false },
                  sun: { lunchSelected: Boolean(remoteSelections.sun), lunchCheckedIn: false, lunchMissed: false },
                  mon: { lunchSelected: Boolean(remoteSelections.mon), lunchCheckedIn: false, lunchMissed: false },
                  tue: { lunchSelected: Boolean(remoteSelections.tue), lunchCheckedIn: false, lunchMissed: false },
                  wed: { lunchSelected: Boolean(remoteSelections.wed), lunchCheckedIn: false, lunchMissed: false },
                  thu: { lunchSelected: Boolean(remoteSelections.thu), lunchCheckedIn: false, lunchMissed: false },
                  fri: { lunchSelected: Boolean(remoteSelections.fri), lunchCheckedIn: false, lunchMissed: false },
                },
                attendanceToday: {
                  breakfast: false,
                  lunch: "unmarked",
                  dinner: false,
                },
              },
            ];
          }

          return prev.map((s) => {
            if (s.id === studentId) {
              const updatedSched = { ...s.schedule };
              DAYS.forEach((d) => {
                if (typeof remoteSelections[d] === "boolean") {
                  updatedSched[d] = {
                    ...updatedSched[d],
                    lunchSelected: remoteSelections[d],
                  };
                }
              });
              return {
                ...s,
                name: res.student!.name,
                isBlocked: Boolean(res.student!.isBlocked),
                isRedFlagged: Boolean(res.student!.isRedFlagged),
                penaltyReason: res.student!.penaltyReason,
                isPasswordReset: res.student!.isPasswordReset ?? s.isPasswordReset,
                schedule: updatedSched,
              };
            }
            return s;
          });
        });

        setCurrentUserData((prev) =>
          prev
            ? {
                ...prev,
                isBlocked: Boolean(res.student!.isBlocked),
                isRedFlagged: Boolean(res.student!.isRedFlagged),
                penaltyReason: res.student!.penaltyReason,
                isPasswordReset: res.student!.isPasswordReset,
              }
            : null
        );
      }
    } catch (err: unknown) {
      console.error("refreshStudentData error:", err);
    }
  }, [currentUserData]);

  useEffect(() => {
    let ignore = false;
    const loadRoster = async () => {
      try {
        const res = await getAllUsersAction();
        if (!ignore && res.success && Array.isArray(res.users)) {
          const studentUsers = res.users.filter((u: UserListItem) => u.role === "student");
          const chefUsers = res.users.filter((u: UserListItem) => u.role === "chef");

          setStudents(
            studentUsers.map((u: UserListItem) => ({
              id: u._id || u.id || "",
              name: u.name,
              room: u.room || "Room Unassigned",
              email: u.email,
              isBlocked: Boolean(u.isBlocked),
              penaltyReason: u.penaltyReason,
              isRedFlagged: Boolean(u.isRedFlagged),
              isPasswordReset: u.isPasswordReset ?? false,
              schedule: {
                sat: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
                sun: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
                mon: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
                tue: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
                wed: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
                thu: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
                fri: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
              },
              attendanceToday: {
                breakfast: false,
                lunch: "unmarked",
                dinner: false,
              },
            }))
          );

          setChefs(
            chefUsers.map((u: UserListItem) => ({
              id: u._id || u.id || "",
              name: u.name,
              email: u.email,
              shift: u.shift || "Morning & Lunch Session",
              isPasswordReset: u.isPasswordReset ?? false,
            }))
          );
        }
      } catch (err: unknown) {
        console.error("Initial loadRoster error:", err);
      }
    };
    void loadRoster();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    if (currentUserData?.role === "student" && currentUserData?.id) {
      const studentId = currentUserData.id;
      const loadStudent = async () => {
        try {
          const res = await getStudentSelectionAction(studentId);
          if (!ignore && res.success && res.student) {
            setIsGlobalLocked(Boolean(res.isGlobalLocked));
            const remoteSelections = res.selection?.lunchSelections || {};

            setStudents((prev) => {
              const exists = prev.find((s) => s.id === studentId);
              if (!exists) {
                return [
                  ...prev,
                  {
                    id: res.student!.id,
                    name: res.student!.name,
                    room: res.student!.room || "Room Unassigned",
                    email: res.student!.email,
                    isBlocked: Boolean(res.student!.isBlocked),
                    penaltyReason: res.student!.penaltyReason,
                    isRedFlagged: Boolean(res.student!.isRedFlagged),
                    isPasswordReset: res.student!.isPasswordReset ?? false,
                    schedule: {
                      sat: { lunchSelected: Boolean(remoteSelections.sat), lunchCheckedIn: false, lunchMissed: false },
                      sun: { lunchSelected: Boolean(remoteSelections.sun), lunchCheckedIn: false, lunchMissed: false },
                      mon: { lunchSelected: Boolean(remoteSelections.mon), lunchCheckedIn: false, lunchMissed: false },
                      tue: { lunchSelected: Boolean(remoteSelections.tue), lunchCheckedIn: false, lunchMissed: false },
                      wed: { lunchSelected: Boolean(remoteSelections.wed), lunchCheckedIn: false, lunchMissed: false },
                      thu: { lunchSelected: Boolean(remoteSelections.thu), lunchCheckedIn: false, lunchMissed: false },
                      fri: { lunchSelected: Boolean(remoteSelections.fri), lunchCheckedIn: false, lunchMissed: false },
                    },
                    attendanceToday: {
                      breakfast: false,
                      lunch: "unmarked",
                      dinner: false,
                    },
                  },
                ];
              }

              return prev.map((s) => {
                if (s.id === studentId) {
                  const updatedSched = { ...s.schedule };
                  DAYS.forEach((d) => {
                    if (typeof remoteSelections[d] === "boolean") {
                      updatedSched[d] = {
                        ...updatedSched[d],
                        lunchSelected: remoteSelections[d],
                      };
                    }
                  });
                  return {
                    ...s,
                    name: res.student!.name,
                    isBlocked: Boolean(res.student!.isBlocked),
                    isRedFlagged: Boolean(res.student!.isRedFlagged),
                    penaltyReason: res.student!.penaltyReason,
                    isPasswordReset: res.student!.isPasswordReset ?? s.isPasswordReset,
                    schedule: updatedSched,
                  };
                }
                return s;
              });
            });
          }
        } catch (err: unknown) {
          console.error("Initial loadStudent error:", err);
        }
      };
      void loadStudent();
    }
    return () => {
      ignore = true;
    };
  }, [currentUserData?.id, currentUserData?.role]);

  /**
   * Direct Database Login Action via Next.js Server Action with JWT Token Storage
   */
  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; role?: Role; message?: string }> => {
    try {
      const result = await loginAction(email, password);

      if (result.success && result.user) {
        if (result.token) {
          setStoredToken(result.token);
        }
        setCurrentUserData(result.user);
        return { success: true, role: result.role };
      }

      return {
        success: false,
        message: result.message || "Invalid email or password.",
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Authentication service currently unavailable.";
      return {
        success: false,
        message: errorMsg,
      };
    }
  };

  // Real Password Change directly via Server Action
  const changePassword = async (newPassword: string, currentPassword?: string) => {
    if (!currentUserData?.id) return { success: false, message: "No active user session." };
    try {
      const res = await updatePasswordAction({
        userId: currentUserData.id,
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setCurrentUserData((prev) => {
          if (!prev) return null;
          const updated = { ...prev, isPasswordReset: false };
          localStorage.setItem("meal_user_session", JSON.stringify(updated));
          return updated;
        });
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Password update failed." };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update password.";
      return { success: false, message: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await logoutAction();
    } catch (err: unknown) {
      console.warn("Logout action error:", err);
    }
    setStoredToken(null);
    setCurrentUserData(null);
    localStorage.removeItem("meal_user_session");
  };

  // Strict Calendar Friday Check (Friday is day 5)
  // Lunch selection is strictly restricted to real calendar Fridays for the upcoming week cycle.
  const isFriday = typeof window !== "undefined" ? new Date().getDay() === 5 : false;
  
  const formattedToday = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const todayDateFormatted = isFriday
    ? `${formattedToday} (Selection Window Open)`
    : `${formattedToday} (Regular Operating Day)`;

  // Active student record
  const activeStudent: StudentRecord =
    students.find((s) => s.id === currentUserData?.id) || {
      id: currentUserData?.id || "",
      name: currentUserData?.name || "Student Resident",
      room: currentUserData?.room || "Room Unassigned",
      email: currentUserData?.email || "",
      isBlocked: Boolean(currentUserData?.isBlocked),
      penaltyReason: currentUserData?.penaltyReason,
      isRedFlagged: Boolean(currentUserData?.isRedFlagged),
      isPasswordReset: currentUserData?.isPasswordReset ?? false,
      schedule: {
        sat: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
        sun: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
        mon: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
        tue: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
        wed: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
        thu: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
        fri: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
      },
      attendanceToday: {
        breakfast: false,
        lunch: "unmarked",
        dinner: false,
      },
    };

  const currentUser = currentUserData
    ? {
        ...currentUserData,
        isBlocked: currentRole === "student" ? activeStudent.isBlocked : false,
        penaltyReason: currentRole === "student" ? activeStudent.penaltyReason : undefined,
        isRedFlagged: currentRole === "student" ? activeStudent.isRedFlagged : false,
        isPasswordReset: currentUserData.isPasswordReset ?? activeStudent.isPasswordReset ?? false,
      }
    : null;

  // Global Lock Toggle directly via Server Action
  const toggleGlobalLock = async () => {
    try {
      const nextLocked = !isGlobalLocked;
      setIsGlobalLocked(nextLocked);
      await toggleGlobalLockAction(nextLocked);
    } catch (err: unknown) {
      console.error("Error toggling global lock:", err);
    }
  };

  // Student Schedule mapping
  const studentSchedule: StudentScheduleDay[] = DAYS.map((day) => {
    const studentDay = activeStudent.schedule[day];
    return {
      day,
      breakfast: { fixed: true, name: "Fresh Baked Bread, Boiled Eggs, Butter, Jam & Hot Tea" },
      dinner: { fixed: true, name: "Grilled Chicken Steak / Lentil Dal, Basmati Rice & Garden Salad" },
      lunch: {
        selected: studentDay?.lunchSelected ?? true,
        menuItem: "Hostel Traditional Hot Lunch (Rice, Curry & Seasonal Vegetable)",
        checkedIn: studentDay?.lunchCheckedIn ?? false,
        isAbsentMissed: studentDay?.lunchMissed ?? false,
      },
    };
  });

  // Toggle student lunch choice directly via Server Action
  const toggleStudentLunch = async (day: DayKey): Promise<{ success: boolean; message: string }> => {
    if (!isFriday) {
      return {
        success: false,
        message: "LUNCH SELECTION LOCKED: Lunch choices can ONLY be selected or modified on FRIDAYS.",
      };
    }

    if (isGlobalLocked) {
      return {
        success: false,
        message: "ADMIN LOCKED: The global selection window is currently locked by the administration.",
      };
    }

    if (activeStudent.isBlocked) {
      return {
        success: false,
        message: `RESTRICTED: Your selection is suspended due to: ${activeStudent.penaltyReason || "Disciplinary Penalty"}.`,
      };
    }

    const currentVal = activeStudent.schedule[day]?.lunchSelected ?? true;
    const newVal = !currentVal;

    // Optimistic local update
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === activeStudent.id) {
          return {
            ...s,
            schedule: {
              ...s.schedule,
              [day]: {
                ...s.schedule[day],
                lunchSelected: newVal,
              },
            },
          };
        }
        return s;
      })
    );

    try {
      const selectionsPayload: Record<string, boolean> = {};
      DAYS.forEach((d) => {
        selectionsPayload[d] = d === day ? newVal : activeStudent.schedule[d]?.lunchSelected ?? true;
      });

      const res = await selectStudentLunchAction({
        studentId: activeStudent.id,
        lunchSelections: selectionsPayload,
      });

      return res;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update lunch choice.";
      return {
        success: false,
        message: errorMsg,
      };
    }
  };

  // Admin toggles individual student penalty / block via Server Action
  const toggleStudentPenalty = async (studentId: string, reason?: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const newBlocked = !student.isBlocked;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            isBlocked: newBlocked,
            penaltyReason: newBlocked ? (reason || "Violation of hostel regulations") : undefined,
          };
        }
        return s;
      })
    );

    try {
      await toggleStudentBlockAction({
        studentId,
        isBlocked: newBlocked,
        reason: newBlocked ? reason : undefined,
      });
    } catch (err: unknown) {
      console.error("Error setting block status in DB:", err);
    }
  };

  // Admin Manual Override of Lunch via Server Action
  const adminOverrideStudentLunch = async (studentId: string, day: DayKey) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const currentVal = student.schedule[day]?.lunchSelected ?? false;
    const newVal = !currentVal;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            schedule: {
              ...s.schedule,
              [day]: {
                ...s.schedule[day],
                lunchSelected: newVal,
              },
            },
          };
        }
        return s;
      })
    );

    try {
      await adminOverrideLunchAction({
        studentId,
        day,
        selected: newVal,
      });
    } catch (err: unknown) {
      console.error("Error applying meal override in DB:", err);
    }
  };

  // Admin adds new student directly via Server Action
  const addNewStudent = async (newStudent: { name: string; room: string; email: string }) => {
    try {
      const res = await createUserAction({
        name: newStudent.name,
        room: newStudent.room,
        email: newStudent.email,
        role: "student",
      });

      if (res.success && res.user) {
        const u = res.user;
        const created: StudentRecord = {
          id: u.id,
          name: u.name,
          room: u.room || newStudent.room,
          email: u.email,
          isBlocked: false,
          isRedFlagged: false,
          isPasswordReset: true,
          schedule: {
            sat: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
            sun: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
            mon: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
            tue: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
            wed: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
            thu: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
            fri: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
          },
          attendanceToday: {
            breakfast: false,
            lunch: "unmarked",
            dinner: false,
          },
        };

        setStudents((prev) => [created, ...prev]);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to add student.";
      return { success: false, message: errorMsg };
    }
  };

  // Admin deletes student via Server Action
  const deleteStudent = async (studentId: string) => {
    try {
      await deleteUserAction(studentId);
    } catch (err: unknown) {
      console.error("Error deleting student in DB:", err);
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  // Admin adds new chef directly via Server Action
  const addNewChef = async (newChef: { name: string; email: string; shift: string }) => {
    try {
      const res = await createUserAction({
        name: newChef.name,
        email: newChef.email,
        role: "chef",
        shift: newChef.shift,
      });

      if (res.success && res.user) {
        const u = res.user;
        setChefs((prev) => [
          {
            id: u.id,
            name: u.name,
            email: u.email,
            shift: u.shift || newChef.shift,
            isPasswordReset: true,
          },
          ...prev,
        ]);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to add chef.";
      return { success: false, message: errorMsg };
    }
  };

  // Admin deletes chef via Server Action
  const deleteChef = async (chefId: string) => {
    try {
      await deleteUserAction(chefId);
    } catch (err: unknown) {
      console.error("Error deleting chef in DB:", err);
    }
    setChefs((prev) => prev.filter((c) => c.id !== chefId));
  };

  // Admin Resets a user's password directly via Server Action
  const adminResetPassword = async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await resetPasswordAction(userId);
      if (res.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === userId ? { ...s, isPasswordReset: true } : s))
        );
        setChefs((prev) =>
          prev.map((c) => (c.id === userId ? { ...c, isPasswordReset: true } : c))
        );
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reset password.";
      return { success: false, message: errorMsg };
    }
  };

  // Chef Attendance Actions directly via Server Action
  const markChefBreakfast = async (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            isRedFlagged: false,
            attendanceToday: { ...s.attendanceToday, breakfast: true },
          };
        }
        return s;
      })
    );

    try {
      await checkInStudentAction({
        studentId,
        mealType: "breakfast",
        status: "present",
      });
    } catch (err: unknown) {
      console.error("Error updating breakfast attendance in DB:", err);
    }
  };

  const markChefDinner = async (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            isRedFlagged: false,
            attendanceToday: { ...s.attendanceToday, dinner: true },
          };
        }
        return s;
      })
    );

    try {
      await checkInStudentAction({
        studentId,
        mealType: "dinner",
        status: "present",
      });
    } catch (err: unknown) {
      console.error("Error updating dinner attendance in DB:", err);
    }
  };

  const markChefLunchStatus = async (
    studentId: string,
    status: "present" | "absent"
  ): Promise<{ success: boolean; message: string }> => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return { success: false, message: "Student record not found." };

    const shouldRedFlag = status === "absent";

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            isRedFlagged: shouldRedFlag,
            redFlagReason: shouldRedFlag
              ? "Pre-selected lunch was NOT consumed (unexcused absent violation)"
              : undefined,
            attendanceToday: { ...s.attendanceToday, lunch: status },
            schedule: {
              ...s.schedule,
              [systemDay]: {
                ...s.schedule[systemDay],
                lunchCheckedIn: status === "present",
                lunchMissed: status === "absent",
              },
            },
          };
        }
        return s;
      })
    );

    try {
      await checkInStudentAction({
        studentId,
        mealType: "lunch",
        status,
      });
    } catch (err: unknown) {
      console.error("Error updating lunch check-in in DB:", err);
    }

    return {
      success: true,
      message:
        status === "absent"
          ? `Marked ABSENT: Penalty Red-Flag assigned to ${student.name}.`
          : `Marked PRESENT: Lunch attendance confirmed for ${student.name}.`,
    };
  };

  return (
    <MealAppContext.Provider
      value={{
        currentRole,
        currentUser,
        loginWithCredentials,
        changePassword,
        logout,
        isHydrated,
        backendOnline,
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
        systemDay,
        setSystemDay,
        isFriday,
        todayDateFormatted,
        isGlobalLocked,
        toggleGlobalLock,
        studentSchedule,
        toggleStudentLunch,
        refreshStudentData,
        students,
        chefs,
        toggleStudentPenalty,
        adminOverrideStudentLunch,
        addNewStudent,
        deleteStudent,
        addNewChef,
        deleteChef,
        adminResetPassword,
        refreshAdminRoster,
        markChefBreakfast,
        markChefDinner,
        markChefLunchStatus,
      }}
    >
      {children}
    </MealAppContext.Provider>
  );
}

export function useMealApp() {
  const context = useContext(MealAppContext);
  if (!context) {
    throw new Error("useMealApp must be used within a MealAppProvider");
  }
  return context;
}
