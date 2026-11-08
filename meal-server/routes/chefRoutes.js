import express from "express";
import { getTodayList, checkInStudent } from "../controllers/chefController.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Enforce chef or admin authentication
router.use(verifyToken, requireRole("chef", "admin"));

// GET /api/chef/today-list
router.get("/today-list", getTodayList);

// POST /api/chef/check-in
router.post("/check-in", checkInStudent);

export default router;
