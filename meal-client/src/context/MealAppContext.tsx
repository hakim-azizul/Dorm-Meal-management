"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";

export type Role = "student" | "admin" | "chef";
export type DayKey = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
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
  currentUser: {
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
  } | null;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; role?: Role; message?: string }>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  backendOnline: boolean;

  // Operating Day & System State
  systemDay: DayKey;
  setSystemDay: (day: DayKey) => void;
  toggleFridaySimulation: () => void;
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
  addNewStudent: (student: { name: string; room: string; email: string }) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  addNewChef: (chef: { name: string; email: string; shift: string }) => Promise<void>;
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
  const [currentUserData, setCurrentUserData] = useState<MealAppContextType["currentUser"]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("meal_user_session");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [systemDay, setSystemDay] = useState<DayKey>("mon");
  const [isGlobalLocked, setIsGlobalLocked] = useState<boolean>(false);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [chefs, setChefs] = useState<ChefRecord[]>([]);

  const currentRole = currentUserData?.role || null;

  // Save session to localStorage on change
  useEffect(() => {
    if (currentUserData) {
      localStorage.setItem("meal_user_session", JSON.stringify(currentUserData));
    } else {
      localStorage.removeItem("meal_user_session");
    }
  }, [currentUserData]);

  // Check backend health & fetch live data on mount
  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/", { method: "GET" });
      setBackendOnline(res.ok);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Fetch real users roster from MongoDB for Admin / Attendance
  const refreshAdminRoster = useCallback(async () => {
    try {
      const res = await api.getUsers();
      if (res.success && Array.isArray(res.users)) {
        const studentUsers = res.users.filter((u) => u.role === "student");
        const chefUsers = res.users.filter((u) => u.role === "chef");

        setStudents(
          studentUsers.map((u) => ({
            id: u._id || u.id || "",
            name: u.name,
            room: u.room || "Room Unassigned",
            email: u.email,
            isBlocked: !!u.isBlocked,
            penaltyReason: u.penaltyReason,
            isRedFlagged: !!u.isRedFlagged,
            isPasswordReset: u.isPasswordReset ?? true,
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
          chefUsers.map((u) => ({
            id: u._id || u.id || "",
            name: u.name,
            email: u.email,
            shift: u.shift || "Morning & Lunch Session",
            isPasswordReset: u.isPasswordReset ?? true,
          }))
        );
      }
    } catch {
      // Backend may be offline or starting up
    }
  }, []);

  // Fetch student meal plan from MongoDB
  const refreshStudentData = useCallback(async () => {
    if (!currentUserData?.id || currentUserData.role !== "student") return;
    const studentId = currentUserData.id;

    try {
      const res = await api.getMySelection(studentId);
      if (res.success && res.student) {
        setIsGlobalLocked(!!res.isGlobalLocked);
        const remoteSelections = res.selection?.lunchSelections || {};

        setStudents((prev) => {
          const exists = prev.find((s) => s.id === studentId);
          if (!exists) {
            return [
              ...prev,
              {
                id: res.student.id,
                name: res.student.name,
                room: res.student.room || "Room Unassigned",
                email: res.student.email,
                isBlocked: !!res.student.isBlocked,
                penaltyReason: res.student.penaltyReason,
                isRedFlagged: !!res.student.isRedFlagged,
                isPasswordReset: res.student.isPasswordReset ?? true,
                schedule: {
                  sat: { lunchSelected: !!remoteSelections.sat, lunchCheckedIn: false, lunchMissed: false },
                  sun: { lunchSelected: !!remoteSelections.sun, lunchCheckedIn: false, lunchMissed: false },
                  mon: { lunchSelected: !!remoteSelections.mon, lunchCheckedIn: false, lunchMissed: false },
                  tue: { lunchSelected: !!remoteSelections.tue, lunchCheckedIn: false, lunchMissed: false },
                  wed: { lunchSelected: !!remoteSelections.wed, lunchCheckedIn: false, lunchMissed: false },
                  thu: { lunchSelected: !!remoteSelections.thu, lunchCheckedIn: false, lunchMissed: false },
                  fri: { lunchSelected: !!remoteSelections.fri, lunchCheckedIn: false, lunchMissed: false },
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
                name: res.student.name,
                isBlocked: !!res.student.isBlocked,
                isRedFlagged: !!res.student.isRedFlagged,
                penaltyReason: res.student.penaltyReason,
                isPasswordReset: res.student.isPasswordReset ?? s.isPasswordReset,
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
                isBlocked: !!res.student.isBlocked,
                isRedFlagged: !!res.student.isRedFlagged,
                penaltyReason: res.student.penaltyReason,
                isPasswordReset: res.student.isPasswordReset,
              }
            : null
        );
      }
    } catch {
      // Backend offline
    }
  }, [currentUserData?.id, currentUserData?.role]);

  useEffect(() => {
    checkBackendHealth();
    refreshAdminRoster();
  }, [checkBackendHealth, refreshAdminRoster]);

  useEffect(() => {
    if (currentUserData?.role === "student") {
      refreshStudentData();
    }
  }, [currentUserData?.role, refreshStudentData]);

  // Real Database Login with Email & Password
  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; role?: Role; message?: string }> => {
    try {
      const res = await api.loginUser({ email, password });
      if (res.success && res.user) {
        const u = res.user;
        const userSession: MealAppContextType["currentUser"] = {
          id: u.id || u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          room: u.room,
          shift: u.shift,
          isBlocked: u.isBlocked,
          penaltyReason: u.penaltyReason,
          isRedFlagged: u.isRedFlagged,
          isPasswordReset: u.isPasswordReset,
        };
        setCurrentUserData(userSession);
        return { success: true, role: u.role };
      }
      return { success: false, message: res.message || "Invalid credentials." };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to log in." };
    }
  };

  // Real Password Change
  const changePassword = async (newPassword: string, currentPassword?: string) => {
    if (!currentUserData?.id) return { success: false, message: "No active user session." };
    try {
      const res = await api.changeUserPassword({
        userId: currentUserData.id,
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setCurrentUserData((prev) => (prev ? { ...prev, isPasswordReset: false } : null));
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Password update failed." };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to update password." };
    }
  };

  const logout = () => {
    setCurrentUserData(null);
  };

  const toggleFridaySimulation = () => {
    setSystemDay((prev) => (prev === "fri" ? "mon" : "fri"));
  };

  const isFriday = systemDay === "fri";
  const todayDateFormatted = isFriday
    ? "Friday, Oct 30, 2026 (Selection Window)"
    : "Monday, Oct 26, 2026 (Operating Day)";

  // Active student record
  const activeStudent: StudentRecord =
    students.find((s) => s.id === currentUserData?.id) || {
      id: currentUserData?.id || "",
      name: currentUserData?.name || "Student Resident",
      room: currentUserData?.room || "Room Unassigned",
      email: currentUserData?.email || "",
      isBlocked: !!currentUserData?.isBlocked,
      isRedFlagged: !!currentUserData?.isRedFlagged,
      isPasswordReset: currentUserData?.isPasswordReset ?? true,
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
        isPasswordReset: currentUserData.isPasswordReset ?? activeStudent.isPasswordReset ?? true,
      }
    : null;

  // Global Lock Toggle
  const toggleGlobalLock = async () => {
    const nextLocked = !isGlobalLocked;
    setIsGlobalLocked(nextLocked);
    try {
      await api.toggleGlobalLock(nextLocked);
    } catch (err) {
      console.error("Error setting global lock in DB:", err);
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

  // Toggle student lunch choice
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

    // Local optimistic update
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

      await api.selectLunch({
        studentId: activeStudent.id,
        weekStartDate: "2026-10-24",
        lunchSelections: selectionsPayload,
        simulateFriday: isFriday,
      });
    } catch (err) {
      console.error("Error updating lunch selection in DB:", err);
    }

    return {
      success: true,
      message: `Lunch choice for ${day.toUpperCase()} updated successfully in database.`,
    };
  };

  // Admin toggles individual student penalty / block
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
      await api.toggleBlockStudent({
        studentId,
        isBlocked: newBlocked,
        reason: newBlocked ? reason : undefined,
      });
    } catch (err) {
      console.error("Error setting block status in DB:", err);
    }
  };

  // Admin Manual Override of Lunch
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
      await api.overrideStudentMeal({
        studentId,
        day,
        selected: newVal,
      });
    } catch (err) {
      console.error("Error applying meal override in DB:", err);
    }
  };

  // Admin adds new student with real DB creation and default hashed password "Dorm@1234"
  const addNewStudent = async (newStudent: { name: string; room: string; email: string }) => {
    const res = await api.createUser({
      name: newStudent.name,
      room: newStudent.room,
      email: newStudent.email,
      role: "student",
    });

    if (res.success && res.user) {
      const u = res.user;
      const created: StudentRecord = {
        id: u._id || u.id || "",
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
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      await api.deleteUser(studentId);
    } catch (err) {
      console.error("Error deleting student in DB:", err);
    }
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  // Admin adds new chef with real DB creation and default hashed password "Dorm@1234"
  const addNewChef = async (newChef: { name: string; email: string; shift: string }) => {
    const res = await api.createUser({
      name: newChef.name,
      email: newChef.email,
      role: "chef",
      shift: newChef.shift,
    });

    if (res.success && res.user) {
      const u = res.user;
      setChefs((prev) => [
        {
          id: u._id || u.id || "",
          name: u.name,
          email: u.email,
          shift: u.shift || newChef.shift,
          isPasswordReset: true,
        },
        ...prev,
      ]);
    }
  };

  const deleteChef = async (chefId: string) => {
    try {
      await api.deleteUser(chefId);
    } catch (err) {
      console.error("Error deleting chef in DB:", err);
    }
    setChefs((prev) => prev.filter((c) => c.id !== chefId));
  };

  // Admin Resets a user's password back to "Dorm@1234"
  const adminResetPassword = async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.resetPasswordByAdmin(userId);
      if (res.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === userId ? { ...s, isPasswordReset: true } : s))
        );
        setChefs((prev) =>
          prev.map((c) => (c.id === userId ? { ...c, isPasswordReset: true } : c))
        );
        return { success: true, message: res.message || "Password successfully reset to default." };
      }
      return { success: false, message: res.message || "Password reset failed." };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to reset password." };
    }
  };

  // Chef Attendance Actions
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
      await api.checkInStudent({
        studentId,
        mealType: "breakfast",
        status: "present",
      });
    } catch (err) {
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
      await api.checkInStudent({
        studentId,
        mealType: "dinner",
        status: "present",
      });
    } catch (err) {
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
      await api.checkInStudent({
        studentId,
        mealType: "lunch",
        status,
      });
    } catch (err) {
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
        backendOnline,
        systemDay,
        setSystemDay,
        toggleFridaySimulation,
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
