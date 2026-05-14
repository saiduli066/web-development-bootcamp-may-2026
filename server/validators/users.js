import { z } from "zod";

const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().min(1, "Search query is required")
  })
});

const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User id is required")
  })
});

const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      bio: z.string().max(160).optional()
    })
    .refine((data) => data.name || data.bio, {
      message: "Provide at least one field to update"
    })
});

const avatarSchema = z.object({
  body: z.object({}).optional()
});

export {
  searchUsersSchema,
  userIdParamSchema,
  updateProfileSchema,
  avatarSchema
};
