import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { MealSelection } from "./models/MealSelection.js";
import { SystemConfig } from "./models/SystemConfig.js";
import { getCurrentWeekStartDate } from "./controllers/studentController.js";

const seedData = async () => {
  await connectDB();

  console.log("Seeding initial data...");

  // Reset or initialize SystemConfig
  await SystemConfig.findOneAndUpdate(
    { key: "global_settings" },
    { key: "global_settings", isGlobalLocked: false },
    { upsert: true }
  );

  // Initial Users
  const sampleUsers = [
    {
      name: "Ahmed Al-Mansoor",
      email: "ahmed@hostel.edu",
      role: "student",
      room: "A-204",
      isBlocked: false,
      isRedFlagged: false,
    },
    {
      name: "Omar Tariq",
      email: "omar@hostel.edu",
      role: "student",
      room: "B-108",
      isBlocked: true,
      penaltyReason: "Dorm noise complaint",
      isRedFlagged: false,
    },
    {
      name: "Khalid Bin Ziyad",
      email: "khalid@hostel.edu",
      role: "student",
      room: "C-301",
      isBlocked: false,
      isRedFlagged: false,
    },
    {
      name: "Zaid Mostafa",
      email: "zaid@hostel.edu",
      role: "student",
      room: "A-102",
      isBlocked: false,
      isRedFlagged: false,
    },
    {
      name: "Dr. Ibrahim (Hostel Warden)",
      email: "warden@hostel.edu",
      role: "admin",
      isBlocked: false,
      isRedFlagged: false,
    },
    {
      name: "Chef Mahmoud Hassan",
      email: "chef@hostel.edu",
      role: "chef",
      isBlocked: false,
      isRedFlagged: false,
    },
  ];

  for (const u of sampleUsers) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      const created = await User.create(u);
      console.log(`Created user: ${created.name} (${created.role})`);

      if (created.role === "student") {
        await MealSelection.create({
          studentId: created._id,
          weekStartDate: getCurrentWeekStartDate(),
          lunchSelections: {
            sat: true,
            sun: true,
            mon: created.name !== "Khalid Bin Ziyad", // Khalid opted out on Monday
            tue: true,
            wed: true,
            thu: true,
            fri: false,
          },
        });
      }
    }
  }

  console.log("Seeding completed successfully.");
  process.exit(0);
};

// Check if run directly
if (process.argv[1]?.includes("seed.js")) {
  seedData().catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  });
}
