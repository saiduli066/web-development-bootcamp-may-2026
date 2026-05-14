import express from "express";
import { auth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createConversationSchema,
  conversationIdParamSchema
} from "../validators/conversations.js";
import {
  list,
  create,
  getById,
  remove
} from "../controllers/conversationController.js";

const conversationRoutes = express.Router();

conversationRoutes.get("/", auth, list);
conversationRoutes.post("/", auth, validate(createConversationSchema), create);
conversationRoutes.get("/:id", auth, validate(conversationIdParamSchema), getById);
conversationRoutes.delete("/:id", auth, validate(conversationIdParamSchema), remove);

export { conversationRoutes };
