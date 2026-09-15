"use client";

import * as React from "react";
import { Plus, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCampaignAction } from "@/app/(dashboard)/campaigns/actions";

interface CreateCampaignDialogProps {
  trigger?: React.ReactNode;
}

export function CreateCampaignDialog({ trigger }: CreateCampaignDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form state
  const [name, setName] = React.useState("");
  const [icpDescription, setIcpDescription] = React.useState("");
  const [offerDescription, setOfferDescription] = React.useState("");
  const [campaignObjective, setCampaignObjective] = React.useState("");
  const [targetRegion, setTargetRegion] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "draft">("active");

  const resetForm = () => {
    setName("");
    setIcpDescription("");
    setOfferDescription("");
    setCampaignObjective("");
    setTargetRegion("");
    setDescription("");
    setStatus("active");
    setErrorMessage(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side quick checks
    if (!name.trim()) {
      setErrorMessage("Campaign name is required.");
      return;
    }
    if (icpDescription.trim().length < 10) {
      setErrorMessage("ICP description must be at least 10 characters.");
      return;
    }
    if (offerDescription.trim().length < 10) {
      setErrorMessage("Offer description must be at least 10 characters.");
      return;
    }
    if (campaignObjective.trim().length < 5) {
      setErrorMessage("Campaign objective must be at least 5 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("icp_description", icpDescription.trim());
      formData.set("offer_description", offerDescription.trim());
      formData.set("campaign_objective", campaignObjective.trim());
      if (targetRegion.trim()) formData.set("target_region", targetRegion.trim());
      if (description.trim()) formData.set("description", description.trim());
      formData.set("status", status);

      const result = await createCampaignAction(formData);

      if (!result.success) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      // Success
      setIsSubmitting(false);
      setIsOpen(false);
      resetForm();
    } catch {
      setErrorMessage("An unexpected network or client error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => handleOpenChange(true)} className="inline-block">
          {trigger}
        </div>
      ) : (
        <Button size="sm" className="text-xs" onClick={() => handleOpenChange(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create Campaign
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in-0">
          <div
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Create Outbound Campaign
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Define your ICP, core offer, and strategic messaging hypothesis for this campaign.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body / Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="name" className="font-semibold text-zinc-800 block">
                    Campaign Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="e.g. US Logistics VP Outbound — Q3"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="target_region" className="font-semibold text-zinc-800 block">
                    Target Region
                  </label>
                  <input
                    id="target_region"
                    type="text"
                    placeholder="e.g. North America (US East & Midwest)"
                    value={targetRegion}
                    onChange={(e) => setTargetRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="status" className="font-semibold text-zinc-800 block">
                    Initial Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "active" | "draft")}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white"
                    disabled={isSubmitting}
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="icp_description" className="font-semibold text-zinc-800 block">
                  ICP Description <span className="text-rose-500">*</span>
                  <span className="font-normal text-zinc-400 ml-1">(min 10 chars)</span>
                </label>
                <textarea
                  id="icp_description"
                  required
                  rows={2}
                  placeholder="e.g. Mid-market freight and logistics operations expanding regional fleet capacity."
                  value={icpDescription}
                  onChange={(e) => setIcpDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="offer_description" className="font-semibold text-zinc-800 block">
                  Core Offer / Value Proposition <span className="text-rose-500">*</span>
                  <span className="font-normal text-zinc-400 ml-1">(min 10 chars)</span>
                </label>
                <textarea
                  id="offer_description"
                  required
                  rows={2}
                  placeholder="e.g. Automated route evidence engine and exception triage platform that cuts dispatch delays."
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="campaign_objective" className="font-semibold text-zinc-800 block">
                  Strategic Objective <span className="text-rose-500">*</span>
                  <span className="font-normal text-zinc-400 ml-1">(min 5 chars)</span>
                </label>
                <textarea
                  id="campaign_objective"
                  required
                  rows={2}
                  placeholder="e.g. Initiate dialogue around dispatch bottleneck friction during seasonal volume surges."
                  value={campaignObjective}
                  onChange={(e) => setCampaignObjective(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="font-semibold text-zinc-800 block">
                  Internal Description / Notes
                </label>
                <textarea
                  id="description"
                  rows={2}
                  placeholder="Optional internal notes about target accounts or sales team context."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
