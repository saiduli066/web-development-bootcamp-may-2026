import { z } from "zod";

const createCallSchema = z.object({
  body: z.object({
    conversationId: z.string().min(1, "Conversation id is required"),
    receiverId: z.string().min(1, "Receiver id is required"),
    type: z.enum(["voice", "video"]).default("voice")
  })
});

const updateCallSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Call id is required")
  }),
  body: z.object({
    status: z.enum(["missed", "rejected", "ended"])
  })
});

const callsByConversationSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1, "Conversation id is required")
  })
});

export { createCallSchema, updateCallSchema, callsByConversationSchema };
