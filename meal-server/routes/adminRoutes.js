import express from "express";
import {
  toggleGlobalLock,
  toggleBlockStudent,
  overrideStudentMeal,
  getAllUsers,
  createUser,
  resetUserPassword,
  deleteUser,
} from "../controllers/adminController.js";

const router = express.Router();

// POST /api/admin/toggle-global-lock
router.post("/toggle-global-lock", toggleGlobalLock);

// POST /api/admin/toggle-block
router.post("/toggle-block", toggleBlockStudent);

// POST /api/admin/override-meal
router.post("/override-meal", overrideStudentMeal);

// User management
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.post("/reset-password", resetUserPassword);
router.delete("/users/:id", deleteUser);

export default router;
