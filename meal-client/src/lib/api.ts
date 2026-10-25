/**
 * Centralized API Service Layer for Hostel Meal Management
 * Connects to Express backend at /api
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface StudentSelectionData {
  id: string;
  name: string;
  email: string;
  room?: string;
  isBlocked: boolean;
  isRedFlagged: boolean;
  penaltyReason?: string;
  isGlobalLocked: boolean;
  isFriday: boolean;
  selection: {
    _id?: string;
    studentId: string;
    weekStartDate: string;
    lunchSelections: Record<string, boolean>;
    isLocked: boolean;
  };
  fixedMeals: {
    breakfast: { fixed: boolean; note: string };
    dinner: { fixed: boolean; note: string };
  };
}

export interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "student" | "admin" | "chef";
  room?: string;
  isBlocked: boolean;
  isRedFlagged: boolean;
  penaltyReason?: string;
  createdAt?: string;
}

export interface ChefStudentItem {
  id: string;
  name: string;
  room?: string;
  email: string;
  isBlocked: boolean;
  isRedFlagged: boolean;
  mealType: string;
  preSelected: boolean;
  attendanceStatus: "unmarked" | "present" | "absent";
}

export interface ChefTodayListResponse {
  success: boolean;
  date: string;
  day: string;
  mealType: string;
  totalEligible: number;
  students: ChefStudentItem[];
  message?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (error: any) {
    // Re-throw with descriptive error for caller
    throw new Error(error.message || "Network request failed. Is the backend server running?");
  }
}

/* ==========================================================================
   1. STUDENT API CALLS
   ========================================================================== */

/**
 * Fetch a student's weekly meal plan, Friday status, and admin global lock
 */
export async function getMySelection(
  studentId: string,
  weekStartDate?: string
): Promise<ApiResponse & StudentSelectionData> {
  const query = new URLSearchParams({ studentId });
  if (weekStartDate) query.append("weekStartDate", weekStartDate);
  return request<ApiResponse & StudentSelectionData>(`/meals/my-selection?${query.toString()}`);
}

/**
 * Submit or modify lunch choices (Allowed on Fridays only unless simulated)
 */
export async function selectLunch(payload: {
  studentId: string;
  weekStartDate: string;
  lunchSelections: Record<string, boolean>;
  simulateFriday?: boolean;
}): Promise<ApiResponse> {
  return request<ApiResponse>("/meals/select", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   2. ADMIN API CALLS
   ========================================================================== */

/**
 * Toggle or set the Global Meal Selection Lock
 */
export async function toggleGlobalLock(isLocked?: boolean): Promise<{ success: boolean; isGlobalLocked: boolean; message: string }> {
  return request("/admin/toggle-global-lock", {
    method: "POST",
    body: JSON.stringify(typeof isLocked === "boolean" ? { isLocked } : {}),
  });
}

/**
 * Block or unblock an individual student from modifying meals
 */
export async function toggleBlockStudent(payload: {
  studentId: string;
  isBlocked: boolean;
  reason?: string;
}): Promise<ApiResponse> {
  return request<ApiResponse>("/admin/toggle-block", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Manually update a student's lunch status for any day
 */
export async function overrideStudentMeal(payload: {
  studentId: string;
  weekStartDate?: string;
  day?: string;
  selected?: boolean;
  lunchSelections?: Record<string, boolean>;
}): Promise<ApiResponse> {
  return request<ApiResponse>("/admin/override-meal", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch all registered users (optionally filtered by role)
 */
export async function getUsers(role?: string): Promise<{ success: boolean; count: number; users: UserItem[] }> {
  const query = role ? `?role=${role}` : "";
  return request(`/admin/users${query}`);
}

/**
 * Create a new student or chef account
 */
export async function createUser(payload: {
  name: string;
  email: string;
  role: string;
  room?: string;
}): Promise<ApiResponse<{ user: UserItem }>> {
  return request<ApiResponse<{ user: UserItem }>>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ==========================================================================
   3. CHEF / ATTENDANCE API CALLS
   ========================================================================== */

/**
 * Get daily attendance roster.
 * Breakfast & Dinner return all students; Lunch strictly returns only pre-selected students.
 */
export async function getTodayList(
  mealType: string,
  date?: string,
  day?: string
): Promise<ChefTodayListResponse> {
  const query = new URLSearchParams({ mealType });
  if (date) query.append("date", date);
  if (day) query.append("day", day);
  return request<ChefTodayListResponse>(`/chef/today-list?${query.toString()}`);
}

/**
 * Mark student attendance (present or absent).
 * If lunch & absent -> sets isRedFlagged = true. If present -> clears isRedFlagged.
 */
export async function checkInStudent(payload: {
  studentId: string;
  date?: string;
  mealType: string;
  status: "present" | "absent";
}): Promise<ApiResponse> {
  return request<ApiResponse>("/chef/check-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
