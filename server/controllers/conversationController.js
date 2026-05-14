import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listConversations,
  findOrCreateConversation,
  getConversationById,
  deleteConversation
} from "../services/conversationService.js";

const list = asyncHandler(async (req, res) => {
  const conversations = await listConversations(req.user.id);
  res.json({ conversations });
});

const create = asyncHandler(async (req, res) => {
  const conversation = await findOrCreateConversation(
    req.user.id,
    req.body.participantId
  );
  res.status(201).json({ conversation });
});

const getById = asyncHandler(async (req, res) => {
  const conversation = await getConversationById(req.user.id, req.params.id);
  res.json({ conversation });
});

const remove = asyncHandler(async (req, res) => {
  await deleteConversation(req.user.id, req.params.id);
  res.status(204).send();
});

export { list, create, getById, remove };
