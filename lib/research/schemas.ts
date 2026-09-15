import { z } from "zod";

/**
 * Observed Fact schema representing information directly supported by a verifiable source.
 */
export const observedFactSchema = z.object({
  fact: z
    .string()
    .trim()
    .min(1, "Fact description is required"),
  source_type: z
    .string()
    .trim()
    .min(1, "Source type is required"),
  source_title: z
    .string()
    .trim()
    .min(1, "Source title is required"),
  source_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  source_date: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  notes: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  confidence: z
    .number()
    .min(0, "Confidence must be between 0.0 and 1.0")
    .max(1, "Confidence must be between 0.0 and 1.0")
    .default(1.0),
});

export type ObservedFactInput = z.infer<typeof observedFactSchema>;

/**
 * Reasonable Inference schema representing a logical deduction derived from observed facts.
 * Must include the premise identifying the evidence from which it was derived.
 */
export const reasonableInferenceSchema = z.object({
  inference: z
    .string()
    .trim()
    .min(1, "Inference statement is required"),
  premise: z
    .string()
    .trim()
    .min(1, "Premise identifying supporting evidence is required"),
  source_type: z
    .string()
    .trim()
    .min(1, "Source type is required")
    .default("inference"),
  source_title: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  source_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  source_date: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  notes: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type ReasonableInferenceInput = z.infer<typeof reasonableInferenceSchema>;

/**
 * Unknown Assumption schema representing critical unverified gaps or assumptions.
 */
export const unknownAssumptionSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1, "Unknown topic description is required"),
  notes: z
    .string()
    .trim()
    .min(1, "Notes regarding the unknown are required"),
});

export type UnknownAssumptionInput = z.infer<typeof unknownAssumptionSchema>;

/**
 * Evidence Structure schema holding observed facts, inferences, and unknowns.
 */
export const evidenceStructureSchema = z.object({
  observed_facts: z.array(observedFactSchema).default([]),
  reasonable_inferences: z.array(reasonableInferenceSchema).default([]),
  unknowns: z.array(unknownAssumptionSchema).default([]),
});

export type EvidenceStructureInput = z.infer<typeof evidenceStructureSchema>;

/**
 * Strategic Business Hypothesis schema based on the 7-step narrative:
 * Trigger -> Current State -> Friction -> Consequence -> Future State -> Proof -> CTA
 */
export const businessHypothesisSchema = z.object({
  trigger: z
    .string()
    .trim()
    .min(1, "Business trigger / why now is required"),
  current_state: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  friction: z
    .string()
    .trim()
    .min(1, "Friction / problem hypothesis is required"),
  consequence: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  future_state: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  proof: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  cta: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  personalization_angle: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_source_type: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_source_title: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_source_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_source_date: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_notes: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type BusinessHypothesisInput = z.infer<typeof businessHypothesisSchema>;

/**
 * Save Research Profile input schema.
 */
export const saveResearchProfileSchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID"),
  account_id: z.string().uuid("Invalid account ID").nullable().optional(),
  observed_facts: z.array(observedFactSchema).default([]),
  reasonable_inferences: z.array(reasonableInferenceSchema).default([]),
  unknowns: z.array(unknownAssumptionSchema).default([]),
  business_trigger: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_source_type: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_source_title: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_source_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_source_date: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  trigger_notes: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  problem_hypothesis: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  business_consequence: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  future_state: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  personalization_angle: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  research_status: z
    .enum(["pending", "completed", "failed"])
    .default("completed"),
});

export type SaveResearchProfileInput = z.infer<typeof saveResearchProfileSchema>;
