"use client";

import * as React from "react";
import { EmailDraft } from "@/types";
import { editEmailAction } from "@/app/(dashboard)/actions/email-actions";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle, Edit3 } from "lucide-react";

interface EditEmailDialogProps {
  email: EmailDraft;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditEmailDialog({
  email,
  isOpen,
  onClose,
  onSuccess,
}: EditEmailDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [subjectLine, setSubjectLine] = React.useState(email.subject_line || "");
  const [previewText, setPreviewText] = React.useState(email.preview_text || "");
  const [bodyText, setBodyText] = React.useState(
    email.body_approved || email.body_generated || ""
  );
  const [psText, setPsText] = React.useState(email.ps_text || "");

  React.useEffect(() => {
    if (isOpen) {
      setSubjectLine(email.subject_line || "");
      setPreviewText(email.preview_text || "");
      setBodyText(email.body_approved || email.body_generated || "");
      setPsText(email.ps_text || "");
      setErrorMessage(null);
    }
  }, [isOpen, email]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!subjectLine.trim()) {
      setErrorMessage("Subject line is required.");
      return;
    }

    if (!bodyText.trim()) {
      setErrorMessage("Email body content is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await editEmailAction(email.id, {
        subject_line: subjectLine.trim(),
        preview_text: previewText.trim() || undefined,
        body_approved: bodyText.trim(),
        ps_text: psText.trim() || undefined,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save edited email."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-semibold text-zinc-900">
              Edit Email Copy • {email.lead_name} ({email.lead_company})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 rounded-md p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">
              Subject Line <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="Enter subject line..."
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">
              Preview Text (Optional)
            </label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="Enter complementary preview text..."
              maxLength={255}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700">
                Body Copy (4–5 Sentences) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-zinc-400">
                Editing sets status to &apos;edited&apos; (requires explicit approval before dispatch)
              </span>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 text-xs font-sans rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 whitespace-pre-line leading-relaxed"
              placeholder="Enter email body copy..."
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">
              PS Detail (Optional)
            </label>
            <input
              type="text"
              value={psText}
              onChange={(e) => setPsText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="Enter optional PS note..."
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  Saving Changes...
                </>
              ) : (
                "Save Edited Copy"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
