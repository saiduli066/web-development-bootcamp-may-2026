import mongoose from "mongoose";

const avatarSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    avatar: { type: avatarSchema, default: () => ({}) },
    bio: { type: String, default: "" },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    refreshTokens: { type: [String], default: [] },
  },
  { timestamps: true },
);

userSchema.index({ name: "text", username: "text", email: "text" });

const User = mongoose.model("User", userSchema);

export { User };
