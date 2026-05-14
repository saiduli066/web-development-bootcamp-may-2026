import { z } from "zod";

const uploadSchema = z.object({
  body: z.object({}).optional()
});

const sharedMediaSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1, "Conversation id is required")
  }),
  query: z.object({
    type: z.enum(["images", "files", "links", "voice"])
  })
});

export { uploadSchema, sharedMediaSchema };
