import express from "express";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import { uploadSchema, sharedMediaSchema } from "../validators/media.js";
import { upload as uploadMedia, shared } from "../controllers/mediaController.js";

const mediaRoutes = express.Router();

mediaRoutes.post(
  "/upload",
  auth,
  validate(uploadSchema),
  upload.single("file"),
  uploadMedia
);
mediaRoutes.get("/:conversationId", auth, validate(sharedMediaSchema), shared);

export { mediaRoutes };
