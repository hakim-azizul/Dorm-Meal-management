import express from "express";
import { login, changePassword, getProfile } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Public: POST /api/auth/login
router.post("/login", login);

// Protected: POST /api/auth/change-password
router.post("/change-password", verifyToken, changePassword);

// Protected: GET /api/auth/me/:userId
router.get("/me/:userId", verifyToken, getProfile);

export default router;
