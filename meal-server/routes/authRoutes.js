import express from "express";
import { login, changePassword, getProfile } from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/change-password
router.post("/change-password", changePassword);

// GET /api/auth/me/:userId
router.get("/me/:userId", getProfile);

export default router;
