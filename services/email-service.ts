import { EmailDraft } from "@/types";
import { MOCK_EMAILS_FOR_APPROVAL } from "@/lib/mock-data";

export async function getPendingEmails(): Promise<EmailDraft[]> {
  // UI Placeholder stub: returns pending approval email drafts.
  return Promise.resolve(MOCK_EMAILS_FOR_APPROVAL);
}
