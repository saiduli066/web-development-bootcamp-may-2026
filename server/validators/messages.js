import { z } from "zod";

const conversationIdParamSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1, "Conversation id is required")
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string().optional()
  })
});

const sendMessageSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1, "Conversation id is required")
  }),
  body: z
    .object({
      type: z.enum(["text", "image", "video", "file", "audio", "call"]),
      content: z.string().optional(),
      attachmentId: z.string().optional(),
      replyTo: z.string().optional()
    })
    .refine(
      (data) =>
        data.type !== "text" ||
        (data.content && data.content.trim().length > 0),
      { message: "Text messages require content" }
    )
});

const messageIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Message id is required")
  })
});

export { conversationIdParamSchema, sendMessageSchema, messageIdParamSchema };
