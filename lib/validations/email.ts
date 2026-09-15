import { z } from "zod";

export const strategicPurposeSchema = z.enum([
  "relevance",
  "reframe",
  "proof",
  "insight",
  "objection_removal",
  "decision",
]);

export const emailApprovalStatusSchema = z.enum([
  "draft",
  "qa_passed",
  "qa_failed",
  "pending_approval",
  "approved",
  "rejected",
  "edited",
  "needs_manual_review",
]);

export const emailSendingStatusSchema = z.enum([
  "unapproved",
  "queued",
  "sending",
  "sent",
  "failed",
  "cancelled",
]);

export const approveEmailSchema = z.object({
  email_id: z.string().uuid("Invalid email ID"),
});

export type ApproveEmailInput = z.infer<typeof approveEmailSchema>;

export const rejectEmailSchema = z.object({
  email_id: z.string().uuid("Invalid email ID"),
  reason: z
    .string()
    .trim()
    .max(500, "Reason must be 500 characters or less")
    .optional()
    .default(""),
});

export type RejectEmailInput = z.infer<typeof rejectEmailSchema>;

export const editEmailSchema = z.object({
  email_id: z.string().uuid("Invalid email ID"),
  subject_line: z
    .string()
    .trim()
    .min(1, "Subject line is required")
    .max(255, "Subject line must be 255 characters or less"),
  preview_text: z
    .string()
    .trim()
    .max(255, "Preview text must be 255 characters or less")
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  body_approved: z
    .string()
    .trim()
    .min(1, "Email body is required"),
  ps_text: z
    .string()
    .trim()
    .max(500, "PS text must be 500 characters or less")
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type EditEmailInput = z.input<typeof editEmailSchema>;
export type EditEmailOutput = z.infer<typeof editEmailSchema>;

export const stopSequenceSchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID"),
  reason: z
    .string()
    .trim()
    .min(1, "Stop reason is required")
    .max(255, "Stop reason must be 255 characters or less"),
});

export type StopSequenceInput = z.infer<typeof stopSequenceSchema>;
