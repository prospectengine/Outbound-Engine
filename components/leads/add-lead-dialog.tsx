"use client";

import * as React from "react";
import { Plus, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLeadAction } from "@/app/(dashboard)/leads/actions";

interface AddLeadDialogProps {
  campaigns: Array<{ id: string; name: string }>;
  trigger?: React.ReactNode;
  defaultCampaignId?: string;
}

export function AddLeadDialog({
  campaigns,
  trigger,
  defaultCampaignId,
}: AddLeadDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form state
  const [campaignId, setCampaignId] = React.useState(
    defaultCampaignId || (campaigns.length > 0 ? campaigns[0].id : "")
  );
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [companyDomain, setCompanyDomain] = React.useState("");
  const [companyWebsite, setCompanyWebsite] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [companySize, setCompanySize] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [linkedinUrl, setLinkedinUrl] = React.useState("");
  const [leadObjective, setLeadObjective] = React.useState("");

  React.useEffect(() => {
    if (defaultCampaignId) {
      setCampaignId(defaultCampaignId);
    } else if (campaigns.length > 0 && !campaignId) {
      setCampaignId(campaigns[0].id);
    }
  }, [campaigns, defaultCampaignId, campaignId]);

  const resetForm = () => {
    setCampaignId(defaultCampaignId || (campaigns.length > 0 ? campaigns[0].id : ""));
    setFirstName("");
    setLastName("");
    setEmail("");
    setCompanyName("");
    setCompanyDomain("");
    setCompanyWebsite("");
    setJobTitle("");
    setIndustry("");
    setCompanySize("");
    setCountry("");
    setLinkedinUrl("");
    setLeadObjective("");
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
    if (!campaignId) {
      setErrorMessage("Please select a campaign for this prospect.");
      return;
    }
    if (!firstName.trim()) {
      setErrorMessage("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage("Last name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("A valid email address is required.");
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage("Company name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("campaign_id", campaignId);
      formData.set("first_name", firstName.trim());
      formData.set("last_name", lastName.trim());
      formData.set("email", email.trim().toLowerCase());
      formData.set("company_name", companyName.trim());
      if (companyDomain.trim()) formData.set("company_domain", companyDomain.trim());
      if (companyWebsite.trim()) formData.set("company_website", companyWebsite.trim());
      if (jobTitle.trim()) formData.set("job_title", jobTitle.trim());
      if (industry.trim()) formData.set("industry", industry.trim());
      if (companySize.trim()) formData.set("company_size", companySize.trim());
      if (country.trim()) formData.set("country", country.trim());
      if (linkedinUrl.trim()) formData.set("linkedin_url", linkedinUrl.trim());
      if (leadObjective.trim()) formData.set("lead_objective", leadObjective.trim());

      const result = await createLeadAction(formData);

      if (!result.success) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

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
          Add Lead
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
                  Add Prospect Lead
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Enroll an individual prospect into an active campaign and initialize sequence progression.
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {campaigns.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                  <p className="font-semibold">No campaigns available</p>
                  <p className="mt-1 text-amber-700">
                    You need to create a campaign first before adding or importing prospect leads.
                  </p>
                </div>
              ) : (
                <>
                  {/* Campaign selection */}
                  <div className="space-y-1.5">
                    <label htmlFor="lead-campaign" className="font-semibold text-zinc-800 block">
                      Target Campaign <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="lead-campaign"
                      value={campaignId}
                      onChange={(e) => setCampaignId(e.target.value)}
                      required
                      className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      disabled={isSubmitting}
                    >
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="lead-first-name" className="font-semibold text-zinc-800 block">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="lead-first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Sarah"
                        required
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lead-last-name" className="font-semibold text-zinc-800 block">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="lead-last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Jenkins"
                        required
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Email & Job Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="lead-email" className="font-semibold text-zinc-800 block">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="lead-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. sjenkins@acme.com"
                        required
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lead-job-title" className="font-semibold text-zinc-800 block">
                        Job Title
                      </label>
                      <input
                        id="lead-job-title"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. VP of Infrastructure"
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Company & Domain */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="lead-company" className="font-semibold text-zinc-800 block">
                        Company Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="lead-company"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Corporation"
                        required
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lead-domain" className="font-semibold text-zinc-800 block">
                        Company Domain
                      </label>
                      <input
                        id="lead-domain"
                        type="text"
                        value={companyDomain}
                        onChange={(e) => setCompanyDomain(e.target.value)}
                        placeholder="e.g. acme.com"
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Website & LinkedIn */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="lead-website" className="font-semibold text-zinc-800 block">
                        Website URL
                      </label>
                      <input
                        id="lead-website"
                        type="text"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="e.g. https://www.acme.com"
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lead-linkedin" className="font-semibold text-zinc-800 block">
                        LinkedIn URL
                      </label>
                      <input
                        id="lead-linkedin"
                        type="text"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="e.g. https://linkedin.com/in/sarahjenkins"
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Industry & Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="lead-industry" className="font-semibold text-zinc-800 block">
                        Industry
                      </label>
                      <input
                        id="lead-industry"
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g. Fintech / Payments"
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lead-country" className="font-semibold text-zinc-800 block">
                        Country
                      </label>
                      <input
                        id="lead-country"
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. United States"
                        className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Company Size */}
                  <div className="space-y-1.5">
                    <label htmlFor="lead-size" className="font-semibold text-zinc-800 block">
                      Company Size
                    </label>
                    <input
                      id="lead-size"
                      type="text"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      placeholder="e.g. 250-500 employees"
                      className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Lead Objective / Strategic Notes */}
                  <div className="space-y-1.5">
                    <label htmlFor="lead-objective" className="font-semibold text-zinc-800 block">
                      Lead Objective / Strategic Angle
                    </label>
                    <textarea
                      id="lead-objective"
                      rows={2}
                      value={leadObjective}
                      onChange={(e) => setLeadObjective(e.target.value)}
                      placeholder="Specific angle or trigger to explore during research and copywriting..."
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-200">
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
                  disabled={isSubmitting || campaigns.length === 0}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Adding Lead...
                    </>
                  ) : (
                    "Add Lead"
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
