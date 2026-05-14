import express from "express";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  conversationIdParamSchema,
  sendMessageSchema,
  messageIdParamSchema
} from "../validators/messages.js";
import { list, create, read, remove } from "../controllers/messageController.js";

const messageRoutes = express.Router();

messageRoutes.get(
  "/:conversationId",
  auth,
  validate(conversationIdParamSchema),
  list
);
messageRoutes.post(
  "/:conversationId",
  auth,
  validate(sendMessageSchema),
  create
);
messageRoutes.patch("/:id/read", auth, validate(messageIdParamSchema), read);
messageRoutes.delete("/:id", auth, validate(messageIdParamSchema), remove);

export { messageRoutes };
