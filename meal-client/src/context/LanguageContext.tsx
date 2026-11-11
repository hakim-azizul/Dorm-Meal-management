"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ar";

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations = {
  // Global & Navigation
  appName: { en: "WAMY Dining System", ar: "نظام وجبات السكن الندوة" },
  appTitle: { en: "WAMY Dining System", ar: "نظام وجبات السكن الندوة" },
  appSubtitle: { en: "Meal Management", ar: "إدارة الوجبات" },
  home: { en: "Home", ar: "الرئيسية" },
  studentPortal: { en: "Student Dashboard", ar: "لوحة الطالب" },
  adminPortal: { en: "Admin Dashboard", ar: "لوحة المشرف" },
  chefPortal: { en: "Chef Dashboard", ar: "لوحة الطاهي" },
  login: { en: "Sign In", ar: "تسجيل الدخول" },
  logout: { en: "Sign Out", ar: "تسجيل الخروج" },
  switchAccount: { en: "Switch Account", ar: "تبديل الحساب" },
  lightMode: { en: "Light Mode", ar: "الوضع الفاتح" },
  darkMode: { en: "Dark Mode", ar: "الوضع الداكن" },
  language: { en: "Language", ar: "اللغة" },
  roleStudent: { en: "Student", ar: "طالب" },
  roleAdmin: { en: "Hostel Admin", ar: "مشرف السكن" },
  roleChef: { en: "Mess Chef", ar: "طاهي الصالة" },
  activeRole: { en: "Signed in as", ar: "مسجل كـ" },

  // Landing Page
  heroBadge: { en: "Smart Hostel Dining & Attendance", ar: "إدارة ذكية لوجبات وحضور السكن الجامعي" },
  heroTitle: { en: "Automated, Fair & Frictionless Hostel Meals", ar: "وجبات سكنية مؤتمتة، عادلة، وبدون تعقيد" },
  heroSubtitle: { 
    en: "Zero food waste. Students customize lunches when unlocked by admin, breakfast and dinner are always ready, and kitchen managers validate pre-selected meals seamlessly.", 
    ar: "لا هدر للطعام. يحدد الطلاب خيارات الغداء عند فتح القفل الإداري، الفطور والعشاء مضمونان دائمًا، وتأكيد الحضور بدقة للطاهي." 
  },
  ctaDashboard: { en: "Open Dashboard", ar: "فتح لوحة التحكم" },
  ctaLogin: { en: "Sign In to Account", ar: "تسجيل الدخول" },
  feature1Title: { en: "Fixed Breakfast & Dinner", ar: "فطور وعشاء ثابت وتلقائي" },
  feature1Desc: { en: "Never worry about morning or night hunger. Breakfast and dinner are automatically selected and guaranteed for all residents.", ar: "لا داعي للقلق بشأن الصباح والمساء. الفطور والعشاء محجوزان ومضمنان تلقائيًا لجميع المقيمين." },
  feature2Title: { en: "Global Selection Lock Control", ar: "التحكم المباشر عبر القفل العام" },
  feature2Desc: { en: "Lunch selection is exclusively controlled by the Admin's Global Lock toggle. Locked or unlocked instantly to maintain inventory accuracy.", ar: "تحديد وجبات الغداء يتحكم به مباشرة القفل الإداري العام، لتجميد أو فتح خيارات الطلاب فورياً وضبط المخزون بدقة." },
  feature3Title: { en: "Admin Override & Discipline", ar: "تحكم الإدارة والعقوبات الانضباطية" },
  feature3Desc: { en: "Global lock/unlock switch with the ability to pause or penalize individual student meal selections instantly.", ar: "مفتاح إغلاق عام للنظام مع إمكانية تعليق أو معاقبة خيارات الطلاب بشكل فردي وفوري عند المخالفات." },
  feature4Title: { en: "Chef Absence Red Flags", ar: "تنبيهات الغياب باللون الأحمر للطاهي" },
  feature4Desc: { en: "Kitchen staff only serve pre-selected meals. If an attendee misses a meal without notice, subsequent days turn red until check-in.", ar: "يقدم الطاهي الغداء لمن سجلو مسبقاً فقط. غياب الطالب يظهر باللون الأحمر للأيام التالية حتى مراجعة الطاهي." },

  // Days of week
  sat: { en: "Saturday", ar: "السبت" },
  sun: { en: "Sunday", ar: "الأحد" },
  mon: { en: "Monday", ar: "الإثنين" },
  tue: { en: "Tuesday", ar: "الثلاثاء" },
  wed: { en: "Wednesday", ar: "الأربعاء" },
  thu: { en: "Thursday", ar: "الخميس" },
  fri: { en: "Friday", ar: "الجمعة" },

  // Meals
  breakfast: { en: "Breakfast", ar: "الإفطار" },
  lunch: { en: "Lunch", ar: "الغداء" },
  dinner: { en: "Dinner", ar: "العشاء" },

  // Student Dashboard
  studentHeading: { en: "Weekly Meal Selection", ar: "جدول تحديد الوجبات الأسبوعي" },
  studentSubheading: { 
    en: "Choose your lunch preferences for the upcoming week. Breakfast & Dinner are automatically included every day.", 
    ar: "حدد خيارات الغداء للأسبوع القادم. الفطور والعشاء محجوزان ومتاحان تلقائياً كل يوم." 
  },
  selectionLockedNotice: { 
    en: "Meal choices are currently frozen by hostel administration. You can modify choices when the Global Lock is opened.", 
    ar: "تحديد الوجبات وتعديلها مجمد حالياً من قبل الإدارة. يمكنك تعديل الوجبات عند فتح القفل العام." 
  },
  fridayOpenBadge: { en: "SELECTION OPEN", ar: "نافذة الاختيار مفتوحة" },
  fridayClosedBadge: { en: "Selection Frozen (Global Lock)", ar: "مغلق (القفل العام)" },
  fixedNotice: { en: "Fixed & Included Daily", ar: "ثابت ومضمن يومياً" },
  selectLunchLabel: { en: "Opt-in for Lunch Meal", ar: "حجز وجبة الغداء لهذا اليوم" },
  unselectLunchLabel: { en: "Opted-out (No Lunch Meal)", ar: "غير محجوز (بدون غداء)" },
  blockedStudentWarning: { 
    en: "ACCESS RESTRICTED: Your meal selection privileges have been temporarily suspended by the warden.", 
    ar: "تم تقييد الصلاحيات: تم تعليق صلاحية تعديل وجباتك مؤقتاً بقرار من إدارة السكن." 
  },
  redFlagBanner: { 
    en: "ABSENCE WARNING: You missed a previously pre-selected lunch. Please check in with the kitchen chef on your next meal to clear your red flag.", 
    ar: "تنبيه غياب: لقد تغيبت عن وجبة غداء محجوزة مسبقاً. يرجى تأكيد حضورك لدى الطاهي في الوجبة القادمة لإلغاء التنبيه." 
  },
  globalLockBanner: { 
    en: "GLOBAL ADMIN LOCK: All meal selections are currently frozen by hostel administration.", 
    ar: "إغلاق عام من الإدارة: تم تجميد جميع خيارات الوجبات مؤقتاً بقرار إداري عام." 
  },

  // Admin Dashboard
  adminDashboardTitle: { en: "Hostel Meal Administration", ar: "إدارة وجبات السكن الجامعي" },
  adminHeading: { en: "Hostel Meal Administration", ar: "إدارة وجبات السكن الجامعي" },
  globalLockLabel: { en: "Global Meal Selection Lock", ar: "القفل العام لاختيارات الوجبات" },
  globalLockStatus: { en: "Global Lock Status", ar: "حالة القفل العام" },
  locked: { en: "Locked", ar: "مقفل" },
  unlocked: { en: "Unlocked", ar: "مفتوح" },
  lockGlobalBtn: { en: "Activate Global Lock", ar: "تفعيل القفل العام" },
  unlockGlobalBtn: { en: "Deactivate Global Lock", ar: "تعطيل القفل العام" },
  createStudentBtn: { en: "Add Student", ar: "إضافة طالب" },
  createChefBtn: { en: "Add Chef", ar: "إضافة طاهٍ" },
  globalLockHelp: { 
    en: "Instantly freezes or re-opens all student meal selection capabilities system-wide", 
    ar: "تجميد أو إعادة فتح إمكانية تحديد الوجبات لجميع الطلاب فورياً على مستوى النظام بالكامل" 
  },
  lockActive: { en: "LOCKED (All Selections Frozen)", ar: "مُقفل (تجميد اختيارات الجميع)" },
  lockInactive: { en: "UNLOCKED (Students Can Select)", ar: "مفتوح (يمكن للطلاب التحديد)" },
  totalStudents: { en: "Total Students", ar: "إجمالي الطلاب" },
  activePenalties: { en: "Penalized Students", ar: "الطلاب المعاقبون" },
  redFlaggedStudents: { en: "Red-Flagged Absentees", ar: "المسجلين بالراية الحمراء" },
  weeklyLunches: { en: "Lunches Booked This Week", ar: "وجبات الغداء المحجوزة أسبوعياً" },
  studentsTab: { en: "Students & Meal Controls", ar: "الطلاب والتحكم بالوجبات" },
  staffTab: { en: "Chefs & Mess Staff", ar: "طاقم المطبخ والطهاة" },
  searchPlaceholder: { en: "Search student by name, room, or email...", ar: "ابحث بالاسم، الغرفة، أو البريد..." },
  blockStudentBtn: { en: "Block Meals", ar: "حظر الوجبات" },
  unblockStudentBtn: { en: "Lift Block", ar: "فك الحظر" },
  manualOverride: { en: "Manual Override", ar: "تعديل يدوي" },
  manualOverrideHelp: { 
    en: "Click any day badge below to manually toggle lunch for this student upon request:", 
    ar: "انقر على أي يوم لتعديل وجبة الغداء يدوياً لهذا الطالب عند طلبه:" 
  },
  addStudent: { en: "Add Student", ar: "إضافة طالب" },
  addChef: { en: "Add Chef", ar: "إضافة طاهٍ" },

  // Chef Dashboard
  chefHeading: { en: "Daily Mess Attendance", ar: "كشف حضور صالة الطعام اليومي" },
  todayOnlyBadge: { en: "Strictly Restricted to TODAY'S Date", ar: "مقيد حصرياً بتاريخ اليوم فقط" },
  todayLabel: { en: "Operating Date", ar: "يوم التشغيل" },
  breakfastTab: { en: "Breakfast Attendance (All Students)", ar: "حضور الإفطار (كافة الطلاب)" },
  lunchTab: { en: "Lunch Attendance (Pre-Selected ONLY)", ar: "حضور الغداء (للمحجوز مسبقاً فقط)" },
  dinnerTab: { en: "Dinner Attendance (All Students)", ar: "حضور العشاء (كافة الطلاب)" },
  lunchPreSelectedStrictNote: { 
    en: "STRICT RESTRICTION: Only students who pre-selected lunch for today appear here. Unselected students are excluded from this roster.", 
    ar: "تنبيه صارم: يظهر هنا فقط الطلاب الذين حجزوا الغداء مسبقاً لليوم. الطلاب الذين لم يحجزوا تم استبعادهم تماماً." 
  },
  markPresent: { en: "Mark Present", ar: "تسجيل حضور" },
  markAbsent: { en: "Mark Absent", ar: "تسجيل غياب" },
  verifiedPresent: { en: "Present", ar: "حاضر" },
  markedAbsent: { en: "Absent (Flagged)", ar: "غائب (موسوم بالأحمر)" },
  redFlagWarningLabel: { 
    en: "RED-FLAGGED: Missed previous meal! Checking in today clears the red-flag.", 
    ar: "موسوم بالراية الحمراء: تغيب عن وجبة سابقة! تسجيل الحضور اليوم يزيل الراية الحمراء." 
  },
  expectedToday: { en: "Expected for", ar: "المتوقع لوجبة" },
  presentCount: { en: "Checked In Present", ar: "تم تسجيل الحضور" },
  absentCount: { en: "Marked Absent", ar: "المسجلون غياب" },
  strictAttendanceNote: { 
    en: "Attendance is strictly enforced. Only students who pre-selected lunch for today are eligible to check in. Unselected students are excluded from this roster.", 
    ar: "يتم تطبيق الحضور بدقة. فقط الطلاب الذين حجزوا الغداء مسبقاً لليوم مؤهلون لتسجيل الحضور. الطلاب الذين لم يحجزوا تم استبعادهم تماماً." 
  },

  // Login Page
  loginTitle: { en: "Access Meal Management Portal", ar: "الدخول إلى بوابة إدارة الوجبات" },
  loginSubtitle: { en: "Select a user role to enter their isolated dashboard", ar: "اختر دور المستخدم للدخول إلى لوحته المخصصة" },
  signInTitle: { en: "Access Meal Management Portal", ar: "الدخول إلى بوابة إدارة الوجبات" },
  signInSubtitle: { en: "Select a user role to enter their isolated dashboard", ar: "اختر دور المستخدم للدخول إلى لوحته المخصصة" },
  studentRole: { en: "Student", ar: "طالب" },
  adminRole: { en: "Admin (Warden)", ar: "مشرف السكن" },
  chefRole: { en: "Chef (Kitchen)", ar: "طاهي الصالة" },
  emailLabel: { en: "Email Address", ar: "البريد الإلكتروني" },
  passwordLabel: { en: "Account Password", ar: "كلمة المرور" },
  quickAccess: { en: "Role-Based Quick Access", ar: "دخول سريع حسب الدور" },
  loginAsStudent: { en: "Login as Student (Ahmed Al-Mansoor)", ar: "دخول كطالب (أحمد المنصور)" },
  loginAsAdmin: { en: "Login as Admin (Hostel Warden)", ar: "دخول كمشرف (مشرف السكن)" },
  loginAsChef: { en: "Login as Chef (Mess Supervisor)", ar: "دخول كطاهٍ (مسؤول الصالة)" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  room: { en: "Room", ar: "الغرفة" },
  password: { en: "Password", ar: "كلمة المرور" },
  submitLogin: { en: "Sign In to Dashboard", ar: "تسجيل الدخول إلى اللوحة" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("meal_lang") as Language;
      if (saved === "en" || saved === "ar") return saved;
    }
    return "en";
  });

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("meal_lang", lang);
    }
  };

  const dir = language === "ar" ? "rtl" : "ltr";

  const t = (key: string): string => {
    const item = (translations as Record<string, { en: string; ar: string }>)[key];
    if (!item) return String(key);
    return item[language] || item.en || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
