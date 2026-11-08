import express from "express";
import { getMySelection, selectLunch } from "../controllers/studentController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET /api/meals/my-selection (Protected)
router.get("/my-selection", verifyToken, getMySelection);

// POST /api/meals/select (Protected)
router.post("/select", verifyToken, selectLunch);

export default router;
