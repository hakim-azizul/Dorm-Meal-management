import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";

// Routes
import mealRoutes from "./routes/mealRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chefRoutes from "./routes/chefRoutes.js";

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// API Routes
app.use("/api/meals", mealRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chef", chefRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Weekly Meal Management API",
    version: "1.0.0",
    endpoints: {
      student: "/api/meals",
      admin: "/api/admin",
      chef: "/api/chef",
    },
  });
});

app.listen(port, () => {
  console.log(`Meal Management Express Server running on port ${port}`);
});

export default app;
