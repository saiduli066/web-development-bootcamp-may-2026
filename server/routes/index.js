import express from "express";
import { authRoutes } from "./authRoutes.js";
import { userRoutes } from "./userRoutes.js";
import { conversationRoutes } from "./conversationRoutes.js";
import { messageRoutes } from "./messageRoutes.js";
import { mediaRoutes } from "./mediaRoutes.js";
import { callRoutes } from "./callRoutes.js";

const apiRoutes = express.Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/users", userRoutes);
apiRoutes.use("/conversations", conversationRoutes);
apiRoutes.use("/messages", messageRoutes);
apiRoutes.use("/media", mediaRoutes);
apiRoutes.use("/calls", callRoutes);

export { apiRoutes };
