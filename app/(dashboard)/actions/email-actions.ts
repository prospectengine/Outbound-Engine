"use server";

import { revalidatePath } from "next/cache";
import {
  approveEmailDraft,
  rejectEmailDraft,
  editEmailDraft,
} from "@/services/email-service";
import {
  approveEmailSchema,
  rejectEmailSchema,
  editEmailSchema,
  EditEmailInput,
} from "@/lib/validations/email";
import { ActionResult, EmailDraft } from "@/types";

/**
 * Server Action for approving an email draft.
 */
export async function approveEmailAction(
  emailId: string
): Promise<ActionResult<EmailDraft>> {
  try {
    const parseResult = approveEmailSchema.safeParse({ email_id: emailId });
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid email ID",
        code: "VALIDATION_ERROR",
      };
    }

    const draft = await approveEmailDraft(parseResult.data.email_id);

    revalidatePath("/");
    revalidatePath("/leads");
    revalidatePath("/sequences");

    return {
      success: true,
      data: draft,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to approve email draft";
    return {
      success: false,
      error: errorMessage,
      code: "APPROVE_EMAIL_FAILED",
    };
  }
}

/**
 * Server Action for rejecting an email draft.
 */
export async function rejectEmailAction(
  emailId: string,
  reason?: string
): Promise<ActionResult<EmailDraft>> {
  try {
    const parseResult = rejectEmailSchema.safeParse({
      email_id: emailId,
      reason: reason ?? "",
    });

    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid rejection payload",
        code: "VALIDATION_ERROR",
      };
    }

    const draft = await rejectEmailDraft(
      parseResult.data.email_id,
      parseResult.data.reason
    );

    revalidatePath("/");
    revalidatePath("/leads");
    revalidatePath("/sequences");

    return {
      success: true,
      data: draft,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reject email draft";
    return {
      success: false,
      error: errorMessage,
      code: "REJECT_EMAIL_FAILED",
    };
  }
}

/**
 * Server Action for editing an email draft.
 */
export async function editEmailAction(
  emailId: string,
  input: Omit<EditEmailInput, "email_id">
): Promise<ActionResult<EmailDraft>> {
  try {
    const parseResult = editEmailSchema.safeParse({
      ...input,
      email_id: emailId,
    });

    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid edit input",
        code: "VALIDATION_ERROR",
      };
    }

    const draft = await editEmailDraft(parseResult.data.email_id, {
      subject_line: parseResult.data.subject_line,
      preview_text: parseResult.data.preview_text,
      body_approved: parseResult.data.body_approved,
      ps_text: parseResult.data.ps_text,
    });

    revalidatePath("/");
    revalidatePath("/leads");
    revalidatePath("/sequences");

    return {
      success: true,
      data: draft,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to edit email draft";
    return {
      success: false,
      error: errorMessage,
      code: "EDIT_EMAIL_FAILED",
    };
  }
}
