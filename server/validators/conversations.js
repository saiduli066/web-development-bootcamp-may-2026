import { z } from "zod";

const createConversationSchema = z.object({
  body: z.object({
    participantId: z.string().min(1, "Participant id is required")
  })
});

const conversationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Conversation id is required")
  })
});

export { createConversationSchema, conversationIdParamSchema };
