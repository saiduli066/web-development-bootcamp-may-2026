import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(160).optional(),
});
