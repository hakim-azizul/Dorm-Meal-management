import express from "express";
import {
  toggleGlobalLock,
  toggleBlockStudent,
  overrideStudentMeal,
  getAllUsers,
  createUser,
} from "../controllers/adminController.js";

const router = express.Router();

// POST /api/admin/toggle-global-lock
router.post("/toggle-global-lock", toggleGlobalLock);

// POST /api/admin/toggle-block
router.post("/toggle-block", toggleBlockStudent);

// POST /api/admin/override-meal
router.post("/override-meal", overrideStudentMeal);

// User management helpers
router.get("/users", getAllUsers);
router.post("/users", createUser);

export default router;
