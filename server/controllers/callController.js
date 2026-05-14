import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createCall,
  updateCallStatus,
  getCallsByConversation
} from "../services/callService.js";

const create = asyncHandler(async (req, res) => {
  const call = await createCall({
    conversationId: req.body.conversationId,
    callerId: req.user.id,
    receiverId: req.body.receiverId,
    type: req.body.type
  });
  res.status(201).json({ call });
});

const updateStatus = asyncHandler(async (req, res) => {
  const call = await updateCallStatus(req.params.id, req.body.status);
  res.json({ call });
});

const list = asyncHandler(async (req, res) => {
  const calls = await getCallsByConversation(
    req.params.conversationId,
    req.user.id
  );
  res.json({ calls });
});

export { create, updateStatus, list };
