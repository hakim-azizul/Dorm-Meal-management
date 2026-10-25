import mongoose from "mongoose";

export const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-vwgi4dy-shard-00-00.yleslu4.mongodb.net:27017,ac-vwgi4dy-shard-00-01.yleslu4.mongodb.net:27017,ac-vwgi4dy-shard-00-02.yleslu4.mongodb.net:27017/weekly-meal?ssl=true&replicaSet=atlas-ydwn0o-shard-0&authSource=admin`;

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Don't crash process immediately in offline/dev environments
    return null;
  }
};
