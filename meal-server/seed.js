import "dotenv/config";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { SystemConfig } from "./models/SystemConfig.js";
import bcrypt from "bcryptjs";

const DEFAULT_ADMIN_PASSWORD = "Dorm@1234";

export const seedData = async () => {
  await connectDB();

  console.log("Initializing system configuration and verifying primary admin account...");

  // Reset or initialize SystemConfig
  await SystemConfig.findOneAndUpdate(
    { key: "global_settings" },
    { key: "global_settings", isGlobalLocked: false },
    { upsert: true }
  );

  // Check if any Admin account exists
  const adminExists = await User.findOne({ role: "admin" });
  if (!adminExists) {
    console.log("No Admin found. Creating initial primary Admin account...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);

    const adminUser = await User.create({
      name: "Hostel Warden",
      email: "warden@hostel.edu",
      role: "admin",
      password: hashedPassword,
      isPasswordReset: false,
      isBlocked: false,
      isRedFlagged: false,
    });
    console.log(`Primary Admin created successfully: ${adminUser.email} (ID: ${adminUser._id})`);
  } else {
    console.log(`Primary Admin exists: ${adminExists.email}`);
  }

  const userCount = await User.countDocuments();
  console.log(`Total users in database: ${userCount}`);
  console.log("Initialization completed.");
};

// Run if called directly
if (process.argv[1]?.endsWith("seed.js")) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}
