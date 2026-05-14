import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
};

export { connectDB };
