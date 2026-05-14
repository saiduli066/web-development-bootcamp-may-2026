import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.js";
import { uploadBuffer } from "../utils/cloudinaryUpload.js";

const searchUsers = async (query, userId) =>
  User.find({ $text: { $search: query }, _id: { $ne: userId } })
    .select("name avatar isOnline lastSeen")
    .limit(20);

const getUserById = async (id) => {
  const user = await User.findById(id).select(
    "name avatar bio isOnline lastSeen"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

const updateProfile = async (userId, updates) => {
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true
  }).select("name avatar bio isOnline lastSeen");

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

export { searchUsers, getUserById, updateProfile, updateAvatar };
