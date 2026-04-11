import { z } from "zod";

export const playerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  ageGroup: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.email("Enter a valid email").optional().or(z.literal("")),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type PlayerInput = z.infer<typeof playerSchema>;