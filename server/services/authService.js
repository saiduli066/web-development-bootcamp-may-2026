import bcrypt from "bcrypt";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/User.js";
import { usernameFromEmail } from "../utils/username.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";

const sanitizeUser = (user) => {
  const data = user.toObject();
  delete data.passwordHash;
  delete data.refreshTokens;
  delete data.__v;
  return data;
};

const getRefreshTokens = (user) => {
  if (!Array.isArray(user.refreshTokens)) {
    user.refreshTokens = [];
  }

  return user.refreshTokens;
};

const generateRandomSuffix = () => {
  const length = Math.floor(Math.random() * 3) + 1;
  const min = length === 1 ? 1 : 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

const generateUniqueUsername = async (email) => {
  const base = usernameFromEmail(email);
  if (!base) {
    throw new ApiError(400, "Invalid email for username generation");
  }

  let candidate = base;
  let attempts = 0;
  while (await User.exists({ username: candidate })) {
    attempts += 1;
    if (attempts > 50) {
      throw new ApiError(409, "Unable to generate a unique username");
    }
    candidate = `${base}${generateRandomSuffix()}`;
  }
  return candidate;
};

const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const username = await generateUniqueUsername(email);
  const user = await User.create({ name, email, username, passwordHash });
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  getRefreshTokens(user).push(refreshToken);
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

  if (!user.username) {
    user.username = await generateUniqueUsername(user.email);
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  getRefreshTokens(user).push(refreshToken);
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
  if (!user || !getRefreshTokens(user).includes(refreshToken)) {
    throw new ApiError(401, "Refresh token expired");
  }

  user.refreshTokens = getRefreshTokens(user).filter(
    (token) => token !== refreshToken,
  );

  if (!user.username) {
    user.username = await generateUniqueUsername(user.email);
  }

  const newAccessToken = signAccessToken(user.id);
  const newRefreshToken = signRefreshToken(user.id);
  getRefreshTokens(user).push(newRefreshToken);
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

  user.refreshTokens = getRefreshTokens(user).filter(
    (token) => token !== refreshToken,
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
