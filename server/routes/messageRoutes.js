import express from "express";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  conversationIdParamSchema,
  sendMessageSchema,
  messageIdParamSchema,
  seenMessagesSchema,
} from "../validators/messages.js";
import {
  list,
  create,
  read,
  seen,
  remove,
} from "../controllers/messageController.js";

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
messageRoutes.patch(
  "/:conversationId/seen",
  auth,
  validate(seenMessagesSchema),
  seen,
);
messageRoutes.patch("/:id/read", auth, validate(messageIdParamSchema), read);
messageRoutes.delete("/:id", auth, validate(messageIdParamSchema), remove);

export { messageRoutes };
