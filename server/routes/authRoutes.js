import express from "express";
import { validate } from "../middleware/validate.js";
import { auth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.js";
import {
  register,
  login,
  refresh,
  logout,
  me
} from "../controllers/authController.js";

const authRoutes = express.Router();

authRoutes.post("/register", authLimiter, validate(registerSchema), register);
authRoutes.post("/login", authLimiter, validate(loginSchema), login);
authRoutes.post("/refresh", validate(refreshSchema), refresh);
authRoutes.post("/logout", auth, logout);
authRoutes.get("/me", auth, me);

export { authRoutes };
