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
  type UserSessionData,
  type UserListItem,
} from "@/app/actions/authActions";
import {
  toggleGlobalLockAction,
  getGlobalLockStatusAction,
  selectStudentLunchAction,
  getStudentSelectionAction,
  toggleStudentBlockAction,
  adminOverrideLunchAction,
  checkInStudentAction,
} from "@/app/actions/mealActions";
import { DAYS, type DayKey } from "@/lib/days";
import {
  buildDefaultSchedule,
  buildStudentFromSelection,
  mapUserToChef,
  mapUserToStudent,
  mergeStudentSelection,
} from "./meal-app/mappers";
import type {
  ChefRecord,
  MealAppContextType,
  Role,
  StudentRecord,
  StudentScheduleDay,
} from "./meal-app/types";

export type {
  ChefRecord,
  DayKey,
  MealType,
  Role,
  StudentRecord,
  StudentScheduleDay,
} from "./meal-app/types";

const MealAppContext = createContext<MealAppContextType | undefined>(undefined);

const getInitialDayKey = (): DayKey => {
  const day = new Date().getDay();
  const map: Record<number, DayKey> = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
  };
  return map[day] || "mon";
};

export function MealAppProvider({ children }: { children: React.ReactNode }) {
  const [currentUserData, setCurrentUserData] = useState<UserSessionData | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [systemDay, setSystemDay] = useState<DayKey>(getInitialDayKey);
  const [isGlobalLocked, setIsGlobalLocked] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [chefs, setChefs] = useState<ChefRecord[]>([]);

  const currentRole = currentUserData?.role || null;
  const currentUserId = currentUserData?.id;
  const currentUserRole = currentUserData?.role;

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // ------------------------------------------------------------------
  // Session hydration & persistence
  // ------------------------------------------------------------------
  // 1. Hydrate the user session safely on client mount without UI flashing.
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
        // Fallback to the server-side session cookie when localStorage is empty
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

  // 2. Persist session updates.
  useEffect(() => {
    if (!isHydrated) return;
    if (currentUserData) {
      localStorage.setItem("meal_user_session", JSON.stringify(currentUserData));
    } else {
      localStorage.removeItem("meal_user_session");
    }
  }, [currentUserData, isHydrated]);

  // 3. Load the Global Lock state with live polling and window-focus reactivity.
  useEffect(() => {
    let ignore = false;
    const fetchLock = async () => {
      try {
        const locked = await getGlobalLockStatusAction();
        if (!ignore) {
          setIsGlobalLocked(locked);
        }
      } catch {
        // silent — the next poll retries
      }
    };

    void fetchLock();
    const interval = setInterval(fetchLock, 4000);
    const onFocus = () => void fetchLock();
    window.addEventListener("focus", onFocus);

    return () => {
      ignore = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // ------------------------------------------------------------------
  // Roster & student selection synchronisation
  // ------------------------------------------------------------------
  // 4. Fetch the full admin roster (students + chefs) from MongoDB.
  const refreshAdminRoster = useCallback(async () => {
    try {
      const res = await getAllUsersAction();
      if (res.success && Array.isArray(res.users)) {
        setStudents(res.users.filter((u: UserListItem) => u.role === "student").map(mapUserToStudent));
        setChefs(res.users.filter((u: UserListItem) => u.role === "chef").map(mapUserToChef));
      }
    } catch (err: unknown) {
      console.error("refreshAdminRoster error:", err);
    }
  }, []);

  // 5. Pull the active student's weekly selection + disciplinary flags.
  //    Single source of truth shared by the initial load and manual refreshes.
  const syncStudentSelection = useCallback(async (studentId: string) => {
    try {
      const res = await getStudentSelectionAction(studentId);
      if (!res.success || !res.student) return;

      setIsGlobalLocked(Boolean(res.isGlobalLocked));

      setStudents((prev) => {
        const existing = prev.find((s) => s.id === studentId);
        if (!existing) return [...prev, buildStudentFromSelection(res)];
        return prev.map((s) => (s.id === studentId ? mergeStudentSelection(s, res) : s));
      });

      setCurrentUserData((prev) =>
        prev
          ? {
              ...prev,
              isBlocked: Boolean(res.student?.isBlocked),
              isRedFlagged: Boolean(res.student?.isRedFlagged),
              penaltyReason: res.student?.penaltyReason,
              isPasswordReset: res.student?.isPasswordReset,
            }
          : null,
      );
    } catch (err: unknown) {
      console.error("syncStudentSelection error:", err);
    }
  }, []);

  const refreshStudentData = useCallback(async () => {
    if (!currentUserId || currentUserRole !== "student") return;
    await syncStudentSelection(currentUserId);
  }, [currentUserId, currentUserRole, syncStudentSelection]);

  // Initial roster load (admin/chef dashboards).
  useEffect(() => {
    const load = async () => {
      await refreshAdminRoster();
    };
    void load();
  }, [refreshAdminRoster]);

  // Initial student selection load (student dashboard).
  useEffect(() => {
    if (!currentUserId || currentUserRole !== "student") return;
    const sync = async () => {
      await syncStudentSelection(currentUserId);
    };
    void sync();
  }, [currentUserId, currentUserRole, syncStudentSelection]);

  // ------------------------------------------------------------------
  // Authentication
  // ------------------------------------------------------------------
  const loginWithCredentials = async (
    email: string,
    password: string,
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

      return { success: false, message: result.message || "Invalid email or password." };
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Authentication service currently unavailable.";
      return { success: false, message: errorMsg };
    }
  };

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

  // ------------------------------------------------------------------
  // Derived session state
  // ------------------------------------------------------------------
  const isFriday = typeof window !== "undefined" ? new Date().getDay() === 5 : false;

  const formattedToday = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const todayDateFormatted = isGlobalLocked
    ? `${formattedToday} (Selection Frozen - Admin Lock)`
    : `${formattedToday} (Selection Open)`;

  const activeStudent: StudentRecord =
    students.find((s) => s.id === currentUserId) || {
      id: currentUserId || "",
      name: currentUserData?.name || "Student Resident",
      room: currentUserData?.room || "Room Unassigned",
      email: currentUserData?.email || "",
      isBlocked: Boolean(currentUserData?.isBlocked),
      penaltyReason: currentUserData?.penaltyReason,
      isRedFlagged: Boolean(currentUserData?.isRedFlagged),
      isPasswordReset: currentUserData?.isPasswordReset ?? false,
      schedule: buildDefaultSchedule(),
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
        penaltyReason:
          currentRole === "student" ? activeStudent.penaltyReason : undefined,
        isRedFlagged: currentRole === "student" ? activeStudent.isRedFlagged : false,
        isPasswordReset:
          currentUserData.isPasswordReset ?? activeStudent.isPasswordReset ?? false,
      }
    : null;

  // ------------------------------------------------------------------
  // Global lock
  // ------------------------------------------------------------------
  const toggleGlobalLock = async () => {
    try {
      const nextLocked = !isGlobalLocked;
      setIsGlobalLocked(nextLocked);
      await toggleGlobalLockAction(nextLocked);
    } catch (err: unknown) {
      console.error("Error toggling global lock:", err);
    }
  };

  // ------------------------------------------------------------------
  // Student weekly schedule
  // ------------------------------------------------------------------
  const studentSchedule: StudentScheduleDay[] = DAYS.map((day) => {
    const studentDay = activeStudent.schedule[day];
    return {
      day,
      breakfast: {
        fixed: true,
        name: "Fresh Baked Bread, Boiled Eggs, Butter, Jam & Hot Tea",
      },
      dinner: {
        fixed: true,
        name: "Grilled Chicken Steak / Lentil Dal, Basmati Rice & Garden Salad",
      },
      lunch: {
        selected: studentDay?.lunchSelected ?? true,
        menuItem: "Hostel Traditional Hot Lunch (Rice, Curry & Seasonal Vegetable)",
        checkedIn: studentDay?.lunchCheckedIn ?? false,
        isAbsentMissed: studentDay?.lunchMissed ?? false,
      },
    };
  });

  const toggleStudentLunch = async (
    day: DayKey,
  ): Promise<{ success: boolean; message: string }> => {
    if (isGlobalLocked) {
      return {
        success: false,
        message:
          "ADMIN LOCKED: The global selection window is currently locked by administration.",
      };
    }

    if (activeStudent.isBlocked) {
      return {
        success: false,
        message: `RESTRICTED: Your selection is suspended due to: ${activeStudent.penaltyReason || "Disciplinary Penalty"}.`,
      };
    }

    const newVal = !activeStudent.schedule[day]?.lunchSelected;

    // Optimistic local update
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === activeStudent.id) {
          return {
            ...s,
            schedule: {
              ...s.schedule,
              [day]: { ...s.schedule[day], lunchSelected: newVal },
            },
          };
        }
        return s;
      }),
    );

    try {
      const selectionsPayload: Record<string, boolean> = {};
      DAYS.forEach((d) => {
        selectionsPayload[d] =
          d === day ? newVal : (activeStudent.schedule[d]?.lunchSelected ?? true);
      });

      return await selectStudentLunchAction({
        studentId: activeStudent.id,
        lunchSelections: selectionsPayload,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update lunch choice.";
      return { success: false, message: errorMsg };
    }
  };

  // ------------------------------------------------------------------
  // Admin roster actions
  // ------------------------------------------------------------------
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
            penaltyReason: newBlocked
              ? reason || "Violation of hostel regulations"
              : undefined,
          };
        }
        return s;
      }),
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

  const adminOverrideStudentLunch = async (studentId: string, day: DayKey) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const newVal = !student.schedule[day]?.lunchSelected;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            schedule: {
              ...s.schedule,
              [day]: { ...s.schedule[day], lunchSelected: newVal },
            },
          };
        }
        return s;
      }),
    );

    try {
      await adminOverrideLunchAction({ studentId, day, selected: newVal });
    } catch (err: unknown) {
      console.error("Error applying meal override in DB:", err);
    }
  };

  const addNewStudent = async (newStudent: {
    name: string;
    room: string;
    email: string;
  }) => {
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
          schedule: buildDefaultSchedule(),
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

  const deleteStudent = async (studentId: string) => {
    try {
      await deleteUserAction(studentId);
    } catch (err: unknown) {
      console.error("Error deleting student in DB:", err);
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

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

  const deleteChef = async (chefId: string) => {
    try {
      await deleteUserAction(chefId);
    } catch (err: unknown) {
      console.error("Error deleting chef in DB:", err);
    }
    setChefs((prev) => prev.filter((c) => c.id !== chefId));
  };

  const adminResetPassword = async (
    userId: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await resetPasswordAction(userId);
      if (res.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === userId ? { ...s, isPasswordReset: true } : s)),
        );
        setChefs((prev) =>
          prev.map((c) => (c.id === userId ? { ...c, isPasswordReset: true } : c)),
        );
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reset password.";
      return { success: false, message: errorMsg };
    }
  };

  // ------------------------------------------------------------------
  // Chef attendance actions
  // ------------------------------------------------------------------
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
      }),
    );

    try {
      await checkInStudentAction({ studentId, mealType: "breakfast", status: "present" });
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
      }),
    );

    try {
      await checkInStudentAction({ studentId, mealType: "dinner", status: "present" });
    } catch (err: unknown) {
      console.error("Error updating dinner attendance in DB:", err);
    }
  };

  const markChefLunchStatus = async (
    studentId: string,
    status: "present" | "absent",
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
      }),
    );

    try {
      await checkInStudentAction({ studentId, mealType: "lunch", status });
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

  const value: MealAppContextType = {
    currentRole,
    currentUser,
    loginWithCredentials,
    changePassword,
    logout,
    isHydrated,
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
  };

  return <MealAppContext.Provider value={value}>{children}</MealAppContext.Provider>;
}

export function useMealApp() {
  const context = useContext(MealAppContext);
  if (!context) {
    throw new Error("useMealApp must be used within a MealAppProvider");
  }
  return context;
}
