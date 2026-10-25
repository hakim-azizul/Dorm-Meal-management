import express from "express";
import { getMySelection, selectLunch } from "../controllers/studentController.js";

const router = express.Router();

// GET /api/meals/my-selection
router.get("/my-selection", getMySelection);

// POST /api/meals/select
router.post("/select", selectLunch);

export default router;
