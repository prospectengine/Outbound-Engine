import { Header } from "@/components/layout/header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getResearchProfileByLeadId,
  getLatestResearchProfile,
} from "@/services/research-service";
import {
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  FileSearch,
} from "lucide-react";
import Link from "next/link";

interface ResearchPageProps {
  searchParams: Promise<{ leadId?: string }>;
}

export default async function ResearchPage({
  searchParams,
}: ResearchPageProps) {
  const { leadId } = await searchParams;

  const profile = leadId
    ? await getResearchProfileByLeadId(leadId)
    : await getLatestResearchProfile();

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Evidence & Research Workbench"
        description="Strict classification of observed facts, reasonable inferences, and unknown assumptions."
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        {!profile ? (
          <Card className="border-dashed border-zinc-300 bg-white text-center py-16">
            <CardContent className="space-y-4 max-w-md mx-auto">
              <FileSearch className="w-10 h-10 text-zinc-400 mx-auto" />
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-zinc-900">
                  {leadId
                    ? "No Research Dossier Found for this Prospect"
                    : "No Research Dossiers Available"}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  {leadId
                    ? "This lead has not yet completed the 3-column evidence research stage (Observed Facts, Reasonable Inferences, and Unknown Assumptions)."
                    : "When prospects are enrolled and researched, synthesized business triggers and 3-column evidence classifications will appear here."}
                </CardDescription>
              </div>
              <Link href="/leads" className="inline-block pt-2">
                <Button variant="outline" size="sm" className="text-xs">
                  View All Leads
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-500 font-medium">
                  Selected Prospect:{" "}
                </span>
                <span className="text-sm font-bold text-zinc-900 ml-1">
                  {profile.lead_name} — {profile.company_name}
                </span>
              </div>
              <Badge
                variant={
                  profile.research_status === "completed"
                    ? "success"
                    : profile.research_status === "failed"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs capitalize"
              >
                Research Status: {profile.research_status}
              </Badge>
            </div>

            {/* Business Trigger Card */}
            <Card className="border-l-4 border-l-blue-600 bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm font-semibold">
                    Synthesized Business Trigger &amp; Hypothesis
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-zinc-900">Trigger: </span>
                  <span className="text-zinc-700">
                    {profile.business_trigger || "—"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-900">
                    Problem Hypothesis:{" "}
                  </span>
                  <span className="text-zinc-700">
                    {profile.problem_hypothesis || "—"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-900">
                    Business Consequence:{" "}
                  </span>
                  <span className="text-zinc-700">
                    {profile.business_consequence || "—"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-900">
                    Target Future State:{" "}
                  </span>
                  <span className="text-zinc-700">
                    {profile.future_state || "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Three-Column Evidence Classification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Observed Facts */}
              <Card className="bg-emerald-50/20 border-emerald-200/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <CardTitle className="text-sm text-emerald-950">
                        Observed Facts
                      </CardTitle>
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      {profile.observed_facts.length} Verified
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px] text-emerald-800">
                    Directly supported by public or verified company records
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.observed_facts.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2">
                      No observed facts recorded.
                    </p>
                  ) : (
                    profile.observed_facts.map((fact, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-lg border border-emerald-200/60 shadow-xs space-y-1.5"
                      >
                        <p className="text-xs font-medium text-zinc-900">
                          {fact.fact}
                        </p>
                        <div className="text-[10px] text-zinc-500 flex items-center justify-between border-t border-zinc-100 pt-1">
                          <span className="capitalize">
                            Source: {fact.source_type.replace("_", " ")}
                          </span>
                          <span>
                            Confidence: {(fact.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Column 2: Reasonable Inferences */}
              <Card className="bg-blue-50/20 border-blue-200/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <CardTitle className="text-sm text-blue-950">
                        Reasonable Inferences
                      </CardTitle>
                    </div>
                    <Badge variant="info" className="text-[10px]">
                      {profile.reasonable_inferences.length} Inferred
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px] text-blue-800">
                    Logical deductions derived from observed facts (requires
                    calibrated copy)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.reasonable_inferences.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2">
                      No inferences recorded.
                    </p>
                  ) : (
                    profile.reasonable_inferences.map((inf, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-lg border border-blue-200/60 shadow-xs space-y-1.5"
                      >
                        <p className="text-xs font-medium text-zinc-900">
                          {inf.inference}
                        </p>
                        <div className="text-[11px] text-zinc-600 bg-zinc-50 p-1.5 rounded">
                          <span className="font-semibold text-zinc-700">
                            Premise:{" "}
                          </span>
                          {inf.premise}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Column 3: Unknowns */}
              <Card className="bg-amber-50/20 border-amber-200/70">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <CardTitle className="text-sm text-amber-950">
                        Unknowns / Assumptions
                      </CardTitle>
                    </div>
                    <Badge variant="warning" className="text-[10px]">
                      {profile.unknowns.length} Unknown
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px] text-amber-800">
                    Unverified areas — never present as established facts in
                    copy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.unknowns.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2">
                      No unknowns recorded.
                    </p>
                  ) : (
                    profile.unknowns.map((unk, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-lg border border-amber-200/60 shadow-xs space-y-1.5"
                      >
                        <p className="text-xs font-semibold text-zinc-900">
                          {unk.topic}
                        </p>
                        <p className="text-[11px] text-zinc-600">{unk.notes}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
