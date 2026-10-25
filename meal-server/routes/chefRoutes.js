import express from "express";
import { getTodayList, checkInStudent } from "../controllers/chefController.js";

const router = express.Router();

// GET /api/chef/today-list
router.get("/today-list", getTodayList);

// POST /api/chef/check-in
router.post("/check-in", checkInStudent);

export default router;
