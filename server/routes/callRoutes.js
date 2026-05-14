import express from "express";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createCallSchema,
  updateCallSchema,
  callsByConversationSchema
} from "../validators/calls.js";
import { create, updateStatus, list } from "../controllers/callController.js";

const callRoutes = express.Router();

callRoutes.post("/", auth, validate(createCallSchema), create);
callRoutes.patch("/:id/status", auth, validate(updateCallSchema), updateStatus);
callRoutes.get("/:conversationId", auth, validate(callsByConversationSchema), list);

export { callRoutes };
