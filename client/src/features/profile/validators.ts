import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(2, "Username is required")
    .regex(/^@?[a-z0-9._-]+$/i, "Username can only contain letters, numbers, . _ -")
    .transform((value) => (value.startsWith("@") ? value : `@${value}`)),
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
});
