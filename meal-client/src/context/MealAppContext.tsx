"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  isPenalized: boolean;
  penaltyReason?: string;
  isRedFlagged: boolean;
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
}

interface MealAppContextType {
  // Authentication & Role Isolation
  currentRole: Role | null;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: Role;
    room?: string;
    isPenalized?: boolean;
    penaltyReason?: string;
    isRedFlagged?: boolean;
  } | null;
  loginAsRole: (role: Role) => void;
  logout: () => void;

  // Operating Day & Date Simulation (Chef Restricted Strictly to Today)
  systemDay: DayKey;
  setSystemDay: (day: DayKey) => void;
  toggleFridaySimulation: () => void;
  isFriday: boolean;
  todayDateFormatted: string;

  // Admin Master Controls
  isGlobalLocked: boolean;
  toggleGlobalLock: () => void;
  toggleStudentPenalty: (studentId: string, reason?: string) => void;
  adminOverrideStudentLunch: (studentId: string, day: DayKey) => void;
  addNewStudent: (student: { name: string; room: string; email: string }) => void;
  deleteStudent: (studentId: string) => void;
  addNewChef: (chef: { name: string; email: string; shift: string }) => void;
  deleteChef: (chefId: string) => void;

  // Student Actions
  studentSchedule: StudentScheduleDay[];
  toggleStudentLunch: (day: DayKey) => { success: boolean; message: string };

  // Chef Attendance Actions
  students: StudentRecord[];
  chefs: ChefRecord[];
  markChefBreakfast: (studentId: string) => void;
  markChefDinner: (studentId: string) => void;
  markChefLunchStatus: (studentId: string, status: "present" | "absent") => { success: boolean; message: string };
  isStudentRedFlaggedForDay: (studentId: string, day: DayKey) => boolean;
}

const MealAppContext = createContext<MealAppContextType | undefined>(undefined);

const DAYS: DayKey[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];

const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: "stu-1",
    name: "Ahmed Al-Mansoor",
    room: "A-204",
    email: "ahmed@hostel.edu",
    isPenalized: false,
    isRedFlagged: true,
    redFlagReason: "Missed pre-selected Sunday lunch without prior check-in",
    schedule: {
      sat: { lunchSelected: true, lunchCheckedIn: true, lunchMissed: false },
      sun: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: true }, // Missed Sunday!
      mon: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false }, // Today!
      tue: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
      wed: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      thu: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      fri: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
    },
    attendanceToday: {
      breakfast: true,
      lunch: "unmarked",
      dinner: false,
    },
  },
  {
    id: "stu-2",
    name: "Omar Tariq",
    room: "B-108",
    email: "omar@hostel.edu",
    isPenalized: true,
    penaltyReason: "Disciplinary hold: Room inspection violation",
    isRedFlagged: false,
    schedule: {
      sat: { lunchSelected: true, lunchCheckedIn: true, lunchMissed: false },
      sun: { lunchSelected: true, lunchCheckedIn: true, lunchMissed: false },
      mon: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      tue: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      wed: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
      thu: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      fri: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
    },
    attendanceToday: {
      breakfast: false,
      lunch: "unmarked",
      dinner: false,
    },
  },
  {
    id: "stu-3",
    name: "Khalid Bin Ziyad",
    room: "C-301",
    email: "khalid@hostel.edu",
    isPenalized: false,
    isRedFlagged: false,
    schedule: {
      sat: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
      sun: { lunchSelected: true, lunchCheckedIn: true, lunchMissed: false },
      mon: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false }, // Did NOT select Monday lunch! MUST NOT appear in lunch tab!
      tue: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      wed: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      thu: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      fri: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
    },
    attendanceToday: {
      breakfast: true,
      lunch: "unmarked",
      dinner: false,
    },
  },
  {
    id: "stu-4",
    name: "Zaid Mostafa",
    room: "A-102",
    email: "zaid@hostel.edu",
    isPenalized: false,
    isRedFlagged: false,
    schedule: {
      sat: { lunchSelected: true, lunchCheckedIn: true, lunchMissed: false },
      sun: { lunchSelected: true, lunchCheckedIn: true, lunchMissed: false },
      mon: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false }, // Pre-selected Monday lunch!
      tue: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      wed: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      thu: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
      fri: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
    },
    attendanceToday: {
      breakfast: false,
      lunch: "unmarked",
      dinner: false,
    },
  },
  {
    id: "stu-5",
    name: "Hamza Al-Nuaimi",
    room: "B-202",
    email: "hamza@hostel.edu",
    isPenalized: false,
    isRedFlagged: false,
    schedule: {
      sat: { lunchSelected: true, lunchCheckedIn: true, lunchMissed: false },
      sun: { lunchSelected: true, lunchCheckedIn: true, lunchMissed: false },
      mon: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      tue: { lunchSelected: false, lunchCheckedIn: false, lunchMissed: false },
      wed: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      thu: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
      fri: { lunchSelected: true, lunchCheckedIn: false, lunchMissed: false },
    },
    attendanceToday: {
      breakfast: true,
      lunch: "unmarked",
      dinner: false,
    },
  },
];

const INITIAL_CHEFS: ChefRecord[] = [
  { id: "chef-1", name: "Chef Mahmoud Hassan", email: "mahmoud@hostel.edu", shift: "Morning & Lunch Session" },
  { id: "chef-2", name: "Chef Farooq Qadir", email: "farooq@hostel.edu", shift: "Dinner & Night Session" },
];

export function MealAppProvider({ children }: { children: React.ReactNode }) {
  // 1. Role & Auth State
  const [currentRole, setCurrentRole] = useState<Role | null>("student");

  // 2. System Day (Default: Monday to illustrate strict Today check-ins; can be simulated as Friday)
  const [systemDay, setSystemDay] = useState<DayKey>("mon");

  // 3. Admin Master Lock
  const [isGlobalLocked, setIsGlobalLocked] = useState<boolean>(false);

  // 4. Data lists
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [chefs, setChefs] = useState<ChefRecord[]>(INITIAL_CHEFS);

  // Active student reference (Ahmed Al-Mansoor)
  const activeStudent = students.find((s) => s.id === "stu-1") || students[0];

  const currentUser = currentRole
    ? {
        id: currentRole === "student" ? activeStudent.id : currentRole === "admin" ? "admin-1" : "chef-1",
        name: currentRole === "student" ? activeStudent.name : currentRole === "admin" ? "Dr. Ibrahim (Hostel Warden)" : "Chef Mahmoud Hassan",
        email: currentRole === "student" ? activeStudent.email : currentRole === "admin" ? "warden@hostel.edu" : "chef@hostel.edu",
        role: currentRole,
        room: currentRole === "student" ? activeStudent.room : undefined,
        isPenalized: currentRole === "student" ? activeStudent.isPenalized : false,
        penaltyReason: currentRole === "student" ? activeStudent.penaltyReason : undefined,
        isRedFlagged: currentRole === "student" ? activeStudent.isRedFlagged : false,
      }
    : null;

  const isFriday = systemDay === "fri";
  const todayDateFormatted = isFriday ? "Friday, Oct 30, 2026 (Selection Day)" : "Monday, Oct 26, 2026 (Operating Day)";

  const loginAsRole = (role: Role) => {
    setCurrentRole(role);
  };

  const logout = () => {
    setCurrentRole(null);
  };

  const toggleFridaySimulation = () => {
    setSystemDay((prev) => (prev === "fri" ? "mon" : "fri"));
  };

  const toggleGlobalLock = () => {
    setIsGlobalLocked((prev) => !prev);
  };

  // Student Weekly Schedule Generator
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

  // Student toggles lunch (Strictly allowed ONLY on Fridays, if not locked, and not penalized)
  const toggleStudentLunch = (day: DayKey): { success: boolean; message: string } => {
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

    if (activeStudent.isPenalized) {
      return {
        success: false,
        message: `RESTRICTED: Your selection is suspended due to: ${activeStudent.penaltyReason || "Disciplinary Penalty"}.`,
      };
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === activeStudent.id) {
          const currentVal = s.schedule[day]?.lunchSelected ?? true;
          return {
            ...s,
            schedule: {
              ...s.schedule,
              [day]: {
                ...s.schedule[day],
                lunchSelected: !currentVal,
              },
            },
          };
        }
        return s;
      })
    );

    return {
      success: true,
      message: `Lunch choice for ${day.toUpperCase()} updated successfully.`,
    };
  };

  // Admin: Instant student penalty toggle with reason
  const toggleStudentPenalty = (studentId: string, reason?: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const newPenalized = !s.isPenalized;
          return {
            ...s,
            isPenalized: newPenalized,
            penaltyReason: newPenalized ? (reason || "Violation of hostel regulations") : undefined,
          };
        }
        return s;
      })
    );
  };

  // Admin: Manual override capability on student lunch selection upon request
  const adminOverrideStudentLunch = (studentId: string, day: DayKey) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const currentVal = s.schedule[day]?.lunchSelected ?? false;
          return {
            ...s,
            schedule: {
              ...s.schedule,
              [day]: {
                ...s.schedule[day],
                lunchSelected: !currentVal,
              },
            },
          };
        }
        return s;
      })
    );
  };

  const addNewStudent = (newStudent: { name: string; room: string; email: string }) => {
    const student: StudentRecord = {
      id: `stu-${Date.now()}`,
      name: newStudent.name,
      room: newStudent.room,
      email: newStudent.email,
      isPenalized: false,
      isRedFlagged: false,
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
    setStudents((prev) => [...prev, student]);
  };

  const deleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const addNewChef = (newChef: { name: string; email: string; shift: string }) => {
    const chef: ChefRecord = {
      id: `chef-${Date.now()}`,
      name: newChef.name,
      email: newChef.email,
      shift: newChef.shift,
    };
    setChefs((prev) => [...prev, chef]);
  };

  const deleteChef = (chefId: string) => {
    setChefs((prev) => prev.filter((c) => c.id !== chefId));
  };

  // Chef Attendance Actions: Breakfast (Fixed)
  const markChefBreakfast = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            attendanceToday: {
              ...s.attendanceToday,
              breakfast: true,
            },
          };
        }
        return s;
      })
    );
  };

  // Chef Attendance Actions: Dinner (Fixed)
  const markChefDinner = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            attendanceToday: {
              ...s.attendanceToday,
              dinner: true,
            },
          };
        }
        return s;
      })
    );
  };

  // Chef Attendance Actions: Lunch (Strict Pre-Selection & Red-Flag Handling)
  const markChefLunchStatus = (studentId: string, status: "present" | "absent"): { success: boolean; message: string } => {
    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) return { success: false, message: "Student not found." };

    if (!targetStudent.schedule[systemDay]?.lunchSelected) {
      return { success: false, message: "Cannot mark attendance: student did not pre-select lunch for today." };
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const isPresent = status === "present";
          // If present: Clears red-flag and marks present!
          // If absent: Flags student with RED-FLAG alert!
          return {
            ...s,
            isRedFlagged: !isPresent,
            redFlagReason: !isPresent ? `Absent on ${systemDay.toUpperCase()} pre-selected lunch` : undefined,
            schedule: {
              ...s.schedule,
              [systemDay]: {
                ...s.schedule[systemDay],
                lunchCheckedIn: isPresent,
                lunchMissed: !isPresent,
              },
            },
            attendanceToday: {
              ...s.attendanceToday,
              lunch: status,
            },
          };
        }
        return s;
      })
    );

    if (status === "present") {
      return {
        success: true,
        message: `Verified attendance for ${targetStudent.name}. Red-flag warnings cleared for remaining meals!`,
      };
    } else {
      return {
        success: true,
        message: `Marked ${targetStudent.name} as ABSENT. Red-Flag indicator activated on student account.`,
      };
    }
  };

  // Check if student has an active red flag for a specific day
  const isStudentRedFlaggedForDay = (studentId: string, day: DayKey): boolean => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return false;
    if (!student.isRedFlagged) return false;

    // If student selected lunch on this day and hasn't checked in, it turns RED
    return !!student.schedule[day]?.lunchSelected && !student.schedule[day]?.lunchCheckedIn;
  };

  return (
    <MealAppContext.Provider
      value={{
        currentRole,
        currentUser,
        loginAsRole,
        logout,
        systemDay,
        setSystemDay,
        toggleFridaySimulation,
        isFriday,
        todayDateFormatted,
        isGlobalLocked,
        toggleGlobalLock,
        toggleStudentPenalty,
        adminOverrideStudentLunch,
        addNewStudent,
        deleteStudent,
        addNewChef,
        deleteChef,
        studentSchedule,
        toggleStudentLunch,
        students,
        chefs,
        markChefBreakfast,
        markChefDinner,
        markChefLunchStatus,
        isStudentRedFlaggedForDay,
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
