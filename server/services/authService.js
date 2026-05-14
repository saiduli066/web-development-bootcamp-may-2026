import bcrypt from "bcrypt";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/tokens.js";

const sanitizeUser = (user) => {
  const data = user.toObject();
  delete data.passwordHash;
  delete data.refreshTokens;
  delete data.__v;
  return data;
};

const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  user.refreshTokens.push(refreshToken);
  await user.save();

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  user.refreshTokens.push(refreshToken);
  await user.save();

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new ApiError(401, "Refresh token expired");
  }

  user.refreshTokens = user.refreshTokens.filter(
    (token) => token !== refreshToken
  );

  const newAccessToken = signAccessToken(user.id);
  const newRefreshToken = signRefreshToken(user.id);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logoutUser = async (userId, refreshToken) => {
  if (!refreshToken) {
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  user.refreshTokens = user.refreshTokens.filter(
    (token) => token !== refreshToken
  );
  await user.save();
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return sanitizeUser(user);
};

export { registerUser, loginUser, refreshSession, logoutUser, getMe };
