"use client";

import * as React from "react";
import { EmailDraft } from "@/types";
import { rejectEmailAction } from "@/app/(dashboard)/actions/email-actions";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle, XCircle } from "lucide-react";

interface RejectEmailDialogProps {
  email: EmailDraft;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RejectEmailDialog({
  email,
  isOpen,
  onClose,
  onSuccess,
}: RejectEmailDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setReason("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await rejectEmailAction(email.id, reason.trim() || undefined);

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to reject email draft."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center space-x-2 text-rose-700">
            <XCircle className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-zinc-900">
              Reject Email Draft
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 rounded-md p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-xs text-zinc-600 leading-relaxed">
            Rejecting this draft for <strong>{email.lead_name}</strong> will remove it from the pending approval queue.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">
              Rejection Reason / Critique (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 leading-relaxed"
              placeholder="E.g., Problem angle misaligned with current focus..."
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100">
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
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
