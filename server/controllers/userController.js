import { asyncHandler } from "../utils/asyncHandler.js";
import {
  searchUsers,
  getUserById,
  getUserByUsername,
  updateProfile,
  updateAvatar
} from "../services/userService.js";

const search = asyncHandler(async (req, res) => {
  const users = await searchUsers(req.query.q, req.user.id);
  res.json({ users });
});

const getById = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  res.json({ user });
});

const getByUsername = asyncHandler(async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  res.json({ user });
});

const update = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user.id, req.body);
  res.json({ user });
});

const uploadAvatarFile = asyncHandler(async (req, res) => {
  const user = await updateAvatar(req.user.id, req.file);
  res.json({ user });
});

export { search, getById, getByUsername, update, uploadAvatarFile };
