import { ApiError } from "../utils/apiError.js";
import { Call } from "../models/Call.js";
import { Conversation } from "../models/Conversation.js";

const ensureParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
};

const createCall = async ({ conversationId, callerId, receiverId, type }) => {
  await ensureParticipant(conversationId, callerId);
  return Call.create({ conversationId, callerId, receiverId, type });
};

const updateCallStatus = async (callId, status) => {
  const call = await Call.findById(callId);
  if (!call) {
    throw new ApiError(404, "Call not found");
  }

  call.status = status;
  call.endedAt = new Date();
  if (call.startedAt) {
    call.duration = Math.max(
      0,
      Math.floor((call.endedAt - call.startedAt) / 1000)
    );
  }
  await call.save();
  return call;
};

const getCallsByConversation = async (conversationId, userId) => {
  await ensureParticipant(conversationId, userId);
  return Call.find({ conversationId }).sort({ startedAt: -1 });
};

export { createCall, updateCallStatus, getCallsByConversation };
