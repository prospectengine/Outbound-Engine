import { z } from "zod";

export const campaignStatusSchema = z.enum([
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const createCampaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Campaign name is required")
    .max(255, "Campaign name must be 255 characters or less"),
  icp_description: z
    .string()
    .trim()
    .min(10, "ICP description must be at least 10 characters"),
  offer_description: z
    .string()
    .trim()
    .min(10, "Offer description must be at least 10 characters"),
  campaign_objective: z
    .string()
    .trim()
    .min(5, "Campaign objective must be at least 5 characters"),
  target_region: z
    .string()
    .trim()
    .max(100, "Target region must be 100 characters or less")
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  description: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  status: campaignStatusSchema.default("active"),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  id: z.string().uuid("Invalid campaign ID"),
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
