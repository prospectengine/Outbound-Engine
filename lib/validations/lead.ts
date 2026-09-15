import { z } from "zod";

export const emailStatusSchema = z.enum([
  "unverified",
  "valid",
  "catch_all",
  "invalid",
]);

export const outreachStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "paused",
  "completed",
  "stopped",
]);

export const approvalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);

export const replyStatusSchema = z.enum([
  "none",
  "replied_interested",
  "replied_not_interested",
  "replied_wrong_person",
  "replied_ooo",
]);

export function normalizeDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const trimmed = domain.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  let cleaned = trimmed.replace(/^https?:\/\//, "");
  cleaned = cleaned.replace(/^www\./, "");
  cleaned = cleaned.split("/")[0].split("?")[0].split("#")[0];
  cleaned = cleaned.replace(/\/+$/, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

export const createLeadSchema = z.object({
  campaign_id: z.string().uuid("Invalid campaign ID"),
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be 100 characters or less"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be 100 characters or less"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less"),
  company_name: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(255, "Company name must be 255 characters or less"),
  company_domain: z
    .string()
    .trim()
    .max(255)
    .nullable()
    .optional()
    .transform(normalizeDomain),
  company_website: z
    .string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  job_title: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  industry: z
    .string()
    .trim()
    .max(150)
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  company_size: z
    .string()
    .trim()
    .max(50)
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  country: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  linkedin_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  lead_objective: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const csvLeadRowSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be 100 characters or less"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be 100 characters or less"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less"),
  company_name: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(255, "Company name must be 255 characters or less"),
  company_domain: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable()
    .transform(normalizeDomain),
  company_website: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  job_title: z
    .string()
    .trim()
    .max(150)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  industry: z
    .string()
    .trim()
    .max(150)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  company_size: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  country: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  linkedin_url: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  lead_objective: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type CsvLeadRowInput = z.infer<typeof csvLeadRowSchema>;

export const importLeadsBatchSchema = z.object({
  campaign_id: z.string().uuid("Invalid campaign ID"),
  rows: z.array(csvLeadRowSchema).min(1, "At least one lead row is required"),
});

export type ImportLeadsBatchInput = z.infer<typeof importLeadsBatchSchema>;
