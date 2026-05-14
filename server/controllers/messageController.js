import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getMessages,
  sendMessage,
  markRead,
  deleteMessage
} from "../services/messageService.js";

const list = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const messages = await getMessages({
    conversationId: req.params.conversationId,
    userId: req.user.id,
    cursor: req.query.cursor,
    limit
  });
  res.json({ messages });
});

const create = asyncHandler(async (req, res) => {
  const payload = await sendMessage({
    conversationId: req.params.conversationId,
    senderId: req.user.id,
    type: req.body.type,
    content: req.body.content,
    attachmentId: req.body.attachmentId,
    replyTo: req.body.replyTo
  });
  res.status(201).json(payload);
});

const read = asyncHandler(async (req, res) => {
  const message = await markRead(req.params.id, req.user.id);
  res.json({ message });
});

const remove = asyncHandler(async (req, res) => {
  await deleteMessage(req.params.id, req.user.id);
  res.status(204).send();
});

export { list, create, read, remove };
