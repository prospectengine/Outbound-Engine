"use server";

import { revalidatePath } from "next/cache";
import { createLead, importLeadsBatch } from "@/services/lead-service";
import {
  createLeadSchema,
  importLeadsBatchSchema,
  CsvLeadRowInput,
} from "@/lib/validations/lead";
import { ActionResult, Lead, BatchImportResult } from "@/types";

/**
 * Server Action for single lead creation.
 */
export async function createLeadAction(
  formData: FormData
): Promise<ActionResult<Lead>> {
  try {
    const rawData = {
      campaign_id: formData.get("campaign_id"),
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      company_name: formData.get("company_name"),
      company_domain: formData.get("company_domain") || undefined,
      company_website: formData.get("company_website") || undefined,
      job_title: formData.get("job_title") || undefined,
      industry: formData.get("industry") || undefined,
      company_size: formData.get("company_size") || undefined,
      country: formData.get("country") || undefined,
      linkedin_url: formData.get("linkedin_url") || undefined,
      lead_objective: formData.get("lead_objective") || undefined,
    };

    const parseResult = createLeadSchema.safeParse(rawData);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return {
        success: false,
        error: firstIssue ? firstIssue.message : "Invalid lead input",
        code: "VALIDATION_ERROR",
      };
    }

    const lead = await createLead(parseResult.data);

    revalidatePath("/leads");
    revalidatePath("/campaigns");
    revalidatePath("/");

    return {
      success: true,
      data: lead,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while creating the lead";
    return {
      success: false,
      error: errorMessage,
      code: "CREATE_LEAD_FAILED",
    };
  }
}

/**
 * Server Action for CSV batch lead import.
 */
export async function importLeadsAction(input: {
  campaign_id: string;
  rows: CsvLeadRowInput[];
}): Promise<ActionResult<BatchImportResult>> {
  try {
    const parseResult = importLeadsBatchSchema.safeParse(input);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return {
        success: false,
        error: firstIssue ? firstIssue.message : "Invalid import payload",
        code: "VALIDATION_ERROR",
      };
    }

    const result = await importLeadsBatch(
      parseResult.data.campaign_id,
      parseResult.data.rows
    );

    if (result.created_count > 0) {
      revalidatePath("/leads");
      revalidatePath("/campaigns");
      revalidatePath("/");
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while importing leads";
    return {
      success: false,
      error: errorMessage,
      code: "IMPORT_LEADS_FAILED",
    };
  }
}
