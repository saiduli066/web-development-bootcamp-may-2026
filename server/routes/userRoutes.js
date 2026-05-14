import express from "express";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
  searchUsersSchema,
  userIdParamSchema,
  updateProfileSchema,
  avatarSchema
} from "../validators/users.js";
import {
  search,
  getById,
  update,
  uploadAvatarFile
} from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.get("/search", auth, validate(searchUsersSchema), search);
userRoutes.get("/:id", auth, validate(userIdParamSchema), getById);
userRoutes.patch("/profile", auth, validate(updateProfileSchema), update);
userRoutes.post(
  "/avatar",
  auth,
  validate(avatarSchema),
  upload.single("file"),
  uploadAvatarFile
);

export { userRoutes };
