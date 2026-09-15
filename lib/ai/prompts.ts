import { StrategicPurpose } from "@/types";
import { ResearchProfile } from "@/types/research";

export interface CopywriterPromptContext {
  lead: {
    first_name: string;
    last_name: string;
    job_title?: string | null;
    industry?: string | null;
    country?: string | null;
  };
  account?: {
    company_name: string;
    domain?: string | null;
    industry?: string | null;
    company_size?: string | null;
  } | null;
  campaign: {
    name: string;
    campaign_objective: string;
    icp_description: string;
    offer_description: string;
    target_region?: string | null;
  };
  research: ResearchProfile;
  stepNumber?: number;
  strategicPurpose?: StrategicPurpose;
  previousFeedbackNotes?: string | null;
}

const STRATEGIC_PURPOSE_GUIDANCE: Record<StrategicPurpose, string> = {
  relevance:
    "Touch 1 (Relevance): Establish the specific business trigger, articulate the likely operational friction, present the desirable future outcome, and close with an interest-based CTA.",
  reframe:
    "Touch 2 (Reframe): Present a fresh perspective on the problem or its hidden commercial consequences. Do not simply repeat Touch 1.",
  proof:
    "Touch 3 (Proof): Focus on credible, verified evidence, relevant customer outcomes, or tangible results from the verified research facts. Never fabricate metrics or customer names.",
  insight:
    "Touch 4 (Insight): Share a valuable industry or operational observation that provides immediate utility to the prospect even if they never buy.",
  objection_removal:
    "Touch 5 (Objection Removal): Directly and empathetically address the most common reason for friction, inaction, or delay.",
  decision:
    "Touch 6 (Decision): Provide a clear, low-pressure decision point making it effortless for the prospect to say yes, not now, or point to the right colleague.",
};

/**
 * Builds the authoritative system and user prompt for the Cold Emails Engine copywriter.
 */
export function buildCopywriterPrompt(context: CopywriterPromptContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const purpose = context.strategicPurpose || "relevance";
  const purposeGuidance = STRATEGIC_PURPOSE_GUIDANCE[purpose];

  const systemPrompt = `You are the Cold Emails Engine Copywriter.
Your responsibility is to produce high-converting, buyer-centric B2B cold email copy grounded strictly in verified research and observable evidence.

OPERATING PRINCIPLES:
1. THE PROSPECT IS THE PROTAGONIST: Lead with their company, role, trigger, and friction. Never lead with the sender, sender's company, or feature lists.
2. CORE 4-5 SENTENCE FRAMEWORK:
   - Sentence 1: Specific Context / Business Trigger (Why contact them now).
   - Sentence 2: Current State / Operational Friction (Articulate their likely bottleneck without pitching).
   - Sentence 3: Desired Future State + Relevant Verified Proof (Concrete outcome; only use proof from verified facts).
   - Sentence 4: Interest-Based Call to Action (Low friction: "Worth exploring?", "Open to comparing notes?", "Curious if you're seeing this too?").
   - Optional Sentence 5: PS only when a genuine personal or research detail exists. Otherwise omit PS.
3. STRICT BREVITY: Maximum 4 to 5 sentences total. Total word count must be under 120 words.
4. STRICT GROUNDING IN EVIDENCE:
   - VERIFIED FACTS may be stated as established facts.
   - REASONABLE INFERENCES must be framed with calibrated humility ("It looks like...", "Teams in this position often...", "You may be experiencing...").
   - UNKNOWNS must NEVER be asserted as facts.
   - NEVER fabricate metrics (percentages, dollar amounts, multiples), company names, customer results, or awards.
5. ANTI-PATTERNS TO AVOID (MANDATORY):
   - NO generic greetings ("I hope this email finds you well", "Hope all is well", "Good morning").
   - NO generic apologies ("Sorry to bother you", "Sorry for the cold email").
   - NO self-serving openers ("My name is...", "We are a leading...", "I am reaching out because we...").
   - NO high-friction CTAs ("Book 30 minutes", "Schedule a demo", "Are you free Tuesday at 10", "Click my calendar link").

OUTPUT FORMAT:
You MUST respond with a valid JSON object matching this exact schema:
{
  "subject_line": "Short, human, curiosity-inducing subject (max 6-8 words, no clickbait)",
  "preview_text": "Complementary preview snippet reinforcing relevance",
  "body_generated": "The 4-5 sentence email body.",
  "ps_text": "Optional PS text or null"
}
Output only the JSON object, with no preamble or markdown wrapping.`;

  const observedFactsFormatted =
    context.research.observed_facts.length > 0
      ? context.research.observed_facts
          .map(
            (f, i) =>
              `  ${i + 1}. [Fact] ${f.fact} (Source: ${f.source_type} - ${f.source_title}, Confidence: ${f.confidence})`
          )
          .join("\n")
      : "  (None provided)";

  const inferencesFormatted =
    context.research.reasonable_inferences.length > 0
      ? context.research.reasonable_inferences
          .map(
            (inf, i) =>
              `  ${i + 1}. [Inference] ${inf.inference} (Derived from Premise: "${inf.premise}")`
          )
          .join("\n")
      : "  (None provided)";

  const unknownsFormatted =
    context.research.unknowns.length > 0
      ? context.research.unknowns
          .map((u, i) => `  ${i + 1}. [Unknown] ${u.topic}: ${u.notes}`)
          .join("\n")
      : "  (None provided)";

  const feedbackSection = context.previousFeedbackNotes
    ? `\nPREVIOUS QA EVALUATION FEEDBACK (Must fix in this attempt):\n${context.previousFeedbackNotes}\n`
    : "";

  const userPrompt = `GENERATE COLD EMAIL DRAFT FOR THE FOLLOWING PROSPECT:

PROSPECT CONTEXT:
- Name: ${context.lead.first_name} ${context.lead.last_name}
- Job Title: ${context.lead.job_title || "Unknown"}
- Industry: ${context.lead.industry || context.account?.industry || "Unknown"}
- Country: ${context.lead.country || "Unknown"}

ACCOUNT CONTEXT:
- Company Name: ${context.account?.company_name || "Unknown Company"}
- Domain: ${context.account?.domain || "Unknown"}
- Company Size: ${context.account?.company_size || "Unknown"}

CAMPAIGN & VALUE PROPOSITION:
- Campaign: ${context.campaign.name}
- Objective: ${context.campaign.campaign_objective}
- Target ICP: ${context.campaign.icp_description}
- Offer / Value Mechanism: ${context.campaign.offer_description}

RESEARCH & EVIDENCE PROFILE:
Verified Observed Facts:
${observedFactsFormatted}

Reasonable Inferences (Must be framed as hypotheses):
${inferencesFormatted}

Unknown Information (DO NOT state as facts):
${unknownsFormatted}

STRATEGIC BUSINESS HYPOTHESIS:
- Business Trigger (Why Now): ${context.research.business_trigger || "Recent business expansion / initiative"}
- Problem / Friction Hypothesis: ${context.research.problem_hypothesis || "Operational bottlenecks in sales execution"}
- Business Consequence: ${context.research.business_consequence || "Revenue leakage and delayed pipeline velocity"}
- Desired Future State: ${context.research.future_state || "Predictable conversion and increased sales capacity"}
- Personalization Angle: ${context.research.personalization_angle || "Relevant company milestone"}

SEQUENCE STRATEGY:
- Step Number: ${context.stepNumber ?? 1}
- Purpose: ${purposeGuidance}
${feedbackSection}
Write the email adhering strictly to the 4-5 sentence structure, interest CTA, and evidence grounding. Return ONLY valid JSON.`;

  return { systemPrompt, userPrompt };
}
