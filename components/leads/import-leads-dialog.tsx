"use client";

import * as React from "react";
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { importLeadsAction } from "@/app/(dashboard)/leads/actions";
import { CsvLeadRowInput } from "@/lib/validations/lead";
import { BatchImportResult } from "@/types";

interface ImportLeadsDialogProps {
  campaigns: Array<{ id: string; name: string }>;
  trigger?: React.ReactNode;
  defaultCampaignId?: string;
}

/**
 * Standard lightweight CSV parser supporting commas, quotes, and newlines.
 */
function parseCsvText(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  if (lines.length < 2) {
    return [];
  }

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let currentVal = "";
    let insideQuote = false;

    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      const nc = line[j + 1];

      if (c === '"') {
        if (insideQuote && nc === '"') {
          currentVal += '"';
          j++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (c === "," && !insideQuote) {
        values.push(currentVal.trim());
        currentVal = "";
      } else {
        currentVal += c;
      }
    }
    values.push(currentVal.trim());
    return values;
  };

  const headers = parseLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "")
  );

  const records: Record<string, string>[] = [];

  for (let k = 1; k < lines.length; k++) {
    const rowValues = parseLine(lines[k]);
    if (rowValues.every((val) => val.trim().length === 0)) continue;

    const rowObj: Record<string, string> = {};
    for (let h = 0; h < headers.length; h++) {
      const header = headers[h];
      rowObj[header] = rowValues[h] ?? "";
    }
    records.push(rowObj);
  }

  return records;
}

/**
 * Maps raw CSV header keys to known Lead input fields.
 */
function mapCsvRecordToLeadRow(raw: Record<string, string>): CsvLeadRowInput {
  const getVal = (...keys: string[]): string | null => {
    for (const key of keys) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      if (raw[normalizedKey] && raw[normalizedKey].trim().length > 0) {
        return raw[normalizedKey].trim();
      }
    }
    return null;
  };

  return {
    first_name: getVal("first_name", "firstname", "first", "first name") || "",
    last_name: getVal("last_name", "lastname", "last", "last name") || "",
    email: getVal("email", "email_address", "email address", "work_email") || "",
    company_name:
      getVal("company_name", "company", "organization", "company name", "account_name") || "",
    company_domain: getVal("company_domain", "domain", "company domain", "account_domain"),
    company_website: getVal("company_website", "website", "company website", "url"),
    job_title: getVal("job_title", "title", "job title", "role", "position"),
    industry: getVal("industry", "sector"),
    company_size: getVal("company_size", "size", "company size", "employees", "headcount"),
    country: getVal("country", "location", "region"),
    linkedin_url: getVal("linkedin_url", "linkedin", "linkedin url", "person_linkedin_url"),
    lead_objective: getVal("lead_objective", "objective", "lead objective", "notes", "angle"),
  };
}

export function ImportLeadsDialog({
  campaigns,
  trigger,
  defaultCampaignId,
}: ImportLeadsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [campaignId, setCampaignId] = React.useState(
    defaultCampaignId || (campaigns.length > 0 ? campaigns[0].id : "")
  );
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<CsvLeadRowInput[]>([]);
  const [importResult, setImportResult] = React.useState<BatchImportResult | null>(null);

  React.useEffect(() => {
    if (defaultCampaignId) {
      setCampaignId(defaultCampaignId);
    } else if (campaigns.length > 0 && !campaignId) {
      setCampaignId(campaigns[0].id);
    }
  }, [campaigns, defaultCampaignId, campaignId]);

  const resetForm = () => {
    setCampaignId(defaultCampaignId || (campaigns.length > 0 ? campaigns[0].id : ""));
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    setErrorMessage(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setImportResult(null);

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setParsedRows([]);
      return;
    }

    if (!selectedFile.name.endsWith(".csv")) {
      setErrorMessage("Please select a valid .csv file.");
      setFile(null);
      setParsedRows([]);
      return;
    }

    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const records = parseCsvText(text);

      if (records.length === 0) {
        setErrorMessage("The selected CSV file appears to be empty or missing header rows.");
        setParsedRows([]);
        return;
      }

      const rows = records.map(mapCsvRecordToLeadRow);
      setParsedRows(rows);
    } catch {
      setErrorMessage("Failed to read the CSV file. Please ensure it is standard UTF-8 encoded text.");
      setParsedRows([]);
    }
  };

  const handleImport = async () => {
    setErrorMessage(null);

    if (!campaignId) {
      setErrorMessage("Please select a target campaign.");
      return;
    }

    if (parsedRows.length === 0) {
      setErrorMessage("No valid rows found to import.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await importLeadsAction({
        campaign_id: campaignId,
        rows: parsedRows,
      });

      if (!result.success) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      setImportResult(result.data);
      setIsSubmitting(false);
    } catch {
      setErrorMessage("An unexpected network or client error occurred while importing leads.");
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
        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleOpenChange(true)}>
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Import CSV / Sheets
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in-0">
          <div
            className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Import Leads from CSV
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Upload a CSV file containing prospect contacts to enroll them into a campaign.
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
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
                    You need to create a campaign first before importing prospect leads.
                  </p>
                </div>
              ) : importResult ? (
                /* Import Summary Screen */
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-2">
                      Import Complete
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                        <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Created</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-900 mt-1">
                          {importResult.created_count}
                        </p>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-center space-x-1.5 text-amber-800 font-semibold">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Duplicates</span>
                        </div>
                        <p className="text-xl font-bold text-amber-900 mt-1">
                          {importResult.duplicate_count}
                        </p>
                      </div>

                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-md">
                        <div className="flex items-center space-x-1.5 text-rose-800 font-semibold">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Failed</span>
                        </div>
                        <p className="text-xl font-bold text-rose-900 mt-1">
                          {importResult.failed_count}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Itemized Results Breakdown */}
                  {importResult.results.some((r) => r.status !== "created") && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-zinc-800 text-xs">
                        Row-Level Warnings & Failures
                      </h4>
                      <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-md divide-y divide-zinc-200">
                        {importResult.results
                          .filter((r) => r.status !== "created")
                          .map((res, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 flex items-start justify-between text-[11px] ${
                                res.status === "duplicate" ? "bg-amber-50/50" : "bg-rose-50/50"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-zinc-900">
                                    Row #{res.row_number}
                                  </span>
                                  <Badge
                                    variant={res.status === "duplicate" ? "warning" : "destructive"}
                                    className="text-[9px] py-0 px-1.5"
                                  >
                                    {res.status}
                                  </Badge>
                                  {res.email && (
                                    <span className="text-zinc-500 font-mono text-[10px]">
                                      {res.email}
                                    </span>
                                  )}
                                </div>
                                <p className="text-zinc-600">
                                  {res.status === "duplicate"
                                    ? res.message
                                    : `[Step: ${res.failed_step}] ${res.error}`}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Upload & Preview Screen */
                <>
                  {/* Campaign Selector */}
                  <div className="space-y-1.5">
                    <label htmlFor="import-campaign" className="font-semibold text-zinc-800 block">
                      Target Campaign <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="import-campaign"
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

                  {/* File Selector */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-800 block">
                      CSV File <span className="text-rose-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-zinc-200 hover:border-zinc-300 rounded-lg p-6 text-center cursor-pointer transition-colors bg-zinc-50/50">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-file-input"
                        disabled={isSubmitting}
                      />
                      <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                        <FileText className="w-8 h-8 text-zinc-400 mx-auto" />
                        <div className="text-xs text-zinc-600">
                          {file ? (
                            <span className="font-semibold text-zinc-900">{file.name}</span>
                          ) : (
                            <>
                              <span className="font-semibold text-zinc-900">Click to upload</span> or drag and drop
                            </>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          CSV must include headers: first_name, last_name, email, company_name
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Parsed Preview Table */}
                  {parsedRows.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800 text-xs">
                          Preview ({parsedRows.length} rows detected)
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Showing first {Math.min(5, parsedRows.length)} rows
                        </span>
                      </div>
                      <div className="border border-zinc-200 rounded-md overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                            <tr>
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Email</th>
                              <th className="py-2 px-3">Company</th>
                              <th className="py-2 px-3">Title</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {parsedRows.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50">
                                <td className="py-2 px-3 font-medium text-zinc-800">
                                  {row.first_name || "—"} {row.last_name || "—"}
                                </td>
                                <td className="py-2 px-3 text-zinc-600">{row.email || "—"}</td>
                                <td className="py-2 px-3 text-zinc-600">
                                  {row.company_name || "—"}
                                </td>
                                <td className="py-2 px-3 text-zinc-500">{row.job_title || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50/50">
              {importResult ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                  >
                    Import Another File
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenChange(false)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white"
                  >
                    Done
                  </Button>
                </>
              ) : (
                <>
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
                    type="button"
                    size="sm"
                    onClick={handleImport}
                    disabled={isSubmitting || parsedRows.length === 0 || campaigns.length === 0}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Importing {parsedRows.length} Leads...
                      </>
                    ) : (
                      `Import ${parsedRows.length > 0 ? `${parsedRows.length} ` : ""}Leads`
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
