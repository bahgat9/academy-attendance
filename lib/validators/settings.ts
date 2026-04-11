import { z } from "zod";

export const settingsSchema = z.object({
  duplicateWindowMinutes: z.coerce.number().int().min(1).max(360),
  recognizedThreshold: z.coerce.number().min(0.2).max(1),
  possibleThreshold: z.coerce.number().min(0.2).max(1),
  scanCooldownMs: z.coerce.number().int().min(500).max(10000),
  sheetRefreshIntervalMs: z.coerce.number().int().min(1000).max(60000),
  soundEnabled: z.boolean(),
  vibrationEnabled: z.boolean(),
}).refine(
  (data) => data.recognizedThreshold <= data.possibleThreshold,
  {
    message: "Recognized threshold must be less than or equal to possible threshold",
    path: ["possibleThreshold"],
  }
);

export type SettingsInput = z.infer<typeof settingsSchema>;