"use server";

import { revalidatePath } from "next/cache";
import { createCampaign } from "@/services/campaign-service";
import { createCampaignSchema } from "@/lib/validations/campaign";
import { ActionResult, Campaign } from "@/types";

export async function createCampaignAction(
  formData: FormData
): Promise<ActionResult<Campaign>> {
  try {
    const rawData = {
      name: formData.get("name"),
      icp_description: formData.get("icp_description"),
      offer_description: formData.get("offer_description"),
      campaign_objective: formData.get("campaign_objective"),
      target_region: formData.get("target_region") || undefined,
      description: formData.get("description") || undefined,
      status: formData.get("status") || "active",
    };

    const parseResult = createCampaignSchema.safeParse(rawData);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return {
        success: false,
        error: firstIssue ? firstIssue.message : "Invalid campaign input",
        code: "VALIDATION_ERROR",
      };
    }

    const campaign = await createCampaign(parseResult.data);

    revalidatePath("/campaigns");
    revalidatePath("/");

    return {
      success: true,
      data: campaign,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred while creating the campaign";
    return {
      success: false,
      error: errorMessage,
      code: "CREATE_CAMPAIGN_FAILED",
    };
  }
}
