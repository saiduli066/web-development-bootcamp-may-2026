import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.js";
import { uploadBuffer } from "../utils/cloudinaryUpload.js";
import { normalizeUsername } from "../utils/username.js";

const searchUsers = async (query, userId) =>
  User.find({ $text: { $search: query }, _id: { $ne: userId } })
    .select("name username email avatar isOnline lastSeen")
    .limit(20);

const getUserById = async (id) => {
  const user = await User.findById(id).select(
    "name username email avatar bio isOnline lastSeen createdAt updatedAt"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

const getUserByUsername = async (username) => {
  const normalized = normalizeUsername(username);
  const user = await User.findOne({ username: normalized }).select(
    "name username email avatar bio isOnline lastSeen createdAt updatedAt"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

const updateProfile = async (userId, updates) => {
  const payload = {};
  if (typeof updates.name === "string") {
    payload.name = updates.name;
  }
  if (typeof updates.bio === "string") {
    payload.bio = updates.bio;
  }
  if (typeof updates.username === "string") {
    const normalized = normalizeUsername(updates.username);
    if (!normalized) {
      throw new ApiError(400, "Username is required");
    }
    const existing = await User.findOne({
      username: normalized,
      _id: { $ne: userId }
    });
    if (existing) {
      throw new ApiError(409, "Username already in use");
    }
    payload.username = normalized;
  }

  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true
  }).select("name username email avatar bio isOnline lastSeen createdAt updatedAt");

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

const updateAvatar = async (userId, file) => {
  if (!file) {
    throw new ApiError(400, "Avatar file is required");
  }

  const result = await uploadBuffer(file.buffer, {
    folder: "chat/avatars",
    resource_type: "image",
    transformation: [{ width: 320, height: 320, crop: "fill" }]
  });

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save();

  return user;
};

export {
  searchUsers,
  getUserById,
  getUserByUsername,
  updateProfile,
  updateAvatar
};
