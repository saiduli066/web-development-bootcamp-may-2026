import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  getMe
} from "../services/authService.js";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await registerUser(req.body);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.status(201).json({ user, accessToken });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.json({ user, accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  const { user, accessToken, refreshToken } = await refreshSession(token);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.json({ user, accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  await logoutUser(req.user.id, token);
  res.clearCookie("refreshToken", refreshCookieOptions);
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  const user = await getMe(req.user.id);
  res.json({ user });
});

export { register, login, refresh, logout, me };
