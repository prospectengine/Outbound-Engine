import { QAScoreBreakdown } from "@/types";
import { ResearchProfile } from "@/types/research";

export interface DeterministicQAInput {
  subject_line: string;
  preview_text?: string | null;
  body_generated: string;
  ps_text?: string | null;
  research?: ResearchProfile | null;
  campaign_offer?: string | null;
}

export interface DeterministicQAResult {
  total_score: number;
  passed: boolean;
  mandatory_failures: string[];
  dimension_scores: QAScoreBreakdown;
  feedback_notes: string | null;
  sentence_count: number;
  word_count: number;
}

const GENERIC_GREETINGS = [
  /i\s+hope\s+this\s+email\s+finds\s+you\s+well/i,
  /hope\s+you('re|\s+are)\s+(doing\s+)?well/i,
  /hope\s+this\s+finds\s+you\s+well/i,
  /hope\s+all\s+is\s+well/i,
  /good\s+(morning|afternoon|evening|day)[,!]?/i,
];

const GENERIC_APOLOGIES = [
  /sorry\s+to\s+bother\s+you/i,
  /sorry\s+for\s+the\s+cold\s+email/i,
  /excuse\s+the\s+intrusion/i,
  /apologies\s+for\s+reaching\s+out/i,
  /pardon\s+the\s+cold\s+outreach/i,
];

const SELF_SERVING_INTROS = [
  /^my\s+name\s+is\b/i,
  /^i('m|\s+am)\s+[A-Z][a-z]+\b/i,
  /^i\s+am\s+reaching\s+out\s+(because\s+we|to\s+introduce)\b/i,
  /^we\s+are\s+a\s+leading\b/i,
  /^we\s+provide\b/i,
  /^our\s+company\s+(helps|provides|is)\b/i,
  /^i\s+wanted\s+to\s+introduce\b/i,
];

const HIGH_FRICTION_CTAS = [
  /book\s+(a\s+)?(30-minute\s+)?demo/i,
  /schedule\s+(a\s+)?(30-minute\s+)?demo/i,
  /book\s+(a\s+)?30[- ]minutes?/i,
  /schedule\s+(a\s+)?30[- ]minutes?/i,
  /30[- ]minute\s+(call|meeting|demo)/i,
  /jump\s+on\s+a\s+(quick\s+)?call/i,
  /hop\s+on\s+a\s+(quick\s+)?call/i,
  /calendly\.com/i,
  /calendar\.app/i,
  /click\s+my\s+calendar/i,
  /are\s+you\s+available\s+tuesday/i,
  /can\s+i\s+steal\s+30\s+minutes/i,
  /grab\s+some\s+time\s+on\s+my\s+calendar/i,
];

const ROBOTIC_BUZZWORDS = [
  /in\s+today's\s+fast-paced\s+world/i,
  /cutting-edge\s+ai/i,
  /revolutionary\s+platform/i,
  /synergize/i,
  /paradigm\s+shift/i,
  /delve\s+into/i,
  /transformative\s+power/i,
  /streamline\s+your\s+workflows\s+seamlessly/i,
];

/**
 * Splits text into sentences cleanly while preserving common abbreviations.
 */
export function countSentences(text: string): { sentences: string[]; count: number } {
  if (!text || text.trim().length === 0) {
    return { sentences: [], count: 0 };
  }

  // Protect common abbreviations and tokens with placeholder
  const protectedText = text
    .replace(/\b(e\.g|i\.e|dr|mr|mrs|ms|inc|corp|co|vs|approx|etc|dept|gen|sr|jr)\./gi, "$1_DOT_")
    .replace(/\b([A-Z])\./g, "$1_DOT_") // initials like J.
    .replace(/(\d+)\.(\d+)/g, "$1_DECIMAL_$2"); // decimals like 4.5

  // Split on sentence-ending punctuation followed by whitespace or end of line
  const rawSentences = protectedText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) =>
      s
        .replace(/_DOT_/g, ".")
        .replace(/_DECIMAL_/g, ".")
        .trim()
    )
    .filter((s) => s.length > 0);

  return {
    sentences: rawSentences,
    count: rawSentences.length,
  };
}

/**
 * Counts words in a string.
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Extracts numeric metrics (percentages, dollar values, multipliers) from text.
 */
export function extractMetrics(text: string): string[] {
  const matches: string[] = [];
  
  // Percentages: e.g. 40%, 15.5%
  const percentRegex = /\b\d+(\.\d+)?%/g;
  let m;
  while ((m = percentRegex.exec(text)) !== null) {
    matches.push(m[0].toLowerCase());
  }

  // Dollar figures: e.g. $100k, $5,000, $2M
  const dollarRegex = /\$\d+[\d,]*(?:\.\d+)?(?:k|m|b)?\b/gi;
  while ((m = dollarRegex.exec(text)) !== null) {
    matches.push(m[0].toLowerCase());
  }

  // Multipliers: e.g. 3x, 10x
  const multiplierRegex = /\b\d+(?:\.\d+)?x\b/gi;
  while ((m = multiplierRegex.exec(text)) !== null) {
    matches.push(m[0].toLowerCase());
  }

  return matches;
}

/**
 * Deterministically evaluates an email candidate against the 50-point rubric
 * and applies mandatory failure constraints.
 */
export function evaluateDeterministicQA(input: DeterministicQAInput): DeterministicQAResult {
  const fullText = [input.body_generated, input.ps_text].filter(Boolean).join(" ");
  const { sentences, count: sentenceCount } = countSentences(input.body_generated);
  const wordCount = countWords(fullText);
  const mandatoryFailures: string[] = [];

  const firstSentence = sentences[0] || "";

  // 1. Mandatory Failure Check: Generic Greetings
  for (const regex of GENERIC_GREETINGS) {
    if (regex.test(input.body_generated)) {
      mandatoryFailures.push("GENERIC_GREETING: Contains generic greeting or pleasantry.");
      break;
    }
  }

  // 2. Mandatory Failure Check: Generic Apologies
  for (const regex of GENERIC_APOLOGIES) {
    if (regex.test(input.body_generated)) {
      mandatoryFailures.push("GENERIC_APOLOGY: Contains generic apology for reaching out.");
      break;
    }
  }

  // 3. Mandatory Failure Check: Self-Serving Intro
  for (const regex of SELF_SERVING_INTROS) {
    if (regex.test(firstSentence.trim())) {
      mandatoryFailures.push("SELF_SERVING_INTRO: First sentence begins with a self-serving company or personal introduction.");
      break;
    }
  }

  // 4. Mandatory Failure Check: High-Friction CTA
  for (const regex of HIGH_FRICTION_CTAS) {
    if (regex.test(input.body_generated)) {
      mandatoryFailures.push("HIGH_FRICTION_CTA: Uses a high-friction meeting/demo demand instead of an interest-based CTA.");
      break;
    }
  }

  // 5. Mandatory Failure Check: Sentence Count > 5
  if (sentenceCount > 5) {
    mandatoryFailures.push(`EXCESSIVE_SENTENCES: Body copy contains ${sentenceCount} sentences (maximum allowed is 5).`);
  }

  // 6. Mandatory Failure Check: Brevity / Word Count > 120
  if (wordCount > 120) {
    mandatoryFailures.push(`EXCESSIVE_WORD_COUNT: Email contains ${wordCount} words (maximum allowed is 120 words).`);
  }

  // Collect all verified text to test against factual grounding
  const researchText = input.research
    ? [
        ...(input.research.observed_facts || []).map((f) => f.fact),
        input.research.business_trigger || "",
        input.research.problem_hypothesis || "",
        input.research.future_state || "",
        input.campaign_offer || "",
      ]
        .join(" ")
        .toLowerCase()
    : "";

  // 7. Mandatory Failure Check: Fabricated Metrics
  const emailMetrics = extractMetrics(fullText);
  const fabricatedMetrics: string[] = [];
  for (const metric of emailMetrics) {
    if (!researchText.includes(metric)) {
      fabricatedMetrics.push(metric);
    }
  }
  if (fabricatedMetrics.length > 0) {
    mandatoryFailures.push(
      `FABRICATED_METRIC: Email claims ungrounded metric(s) [${fabricatedMetrics.join(", ")}] not present in verified research.`
    );
  }

  // 8. Mandatory Failure Check: Unverified Customer Claims
  // Check if text claims "helped [X] achieve" or "case study with [X]" where X is not in research
  const customerClaimMatch = fullText.match(/(?:helped|worked with|case study with)\s+([A-Z][a-zA-Z0-9]+)/);
  if (customerClaimMatch && customerClaimMatch[1]) {
    const claimedCustomer = customerClaimMatch[1].toLowerCase();
    if (!researchText.includes(claimedCustomer)) {
      mandatoryFailures.push(
        `UNVERIFIED_CUSTOMER_CLAIM: Mentioned client '${customerClaimMatch[1]}' not found in verified evidence.`
      );
    }
  }

  // ==========================================
  // 10 DETERMINISTIC RUBRIC DIMENSIONS (1-5 EACH)
  // ==========================================

  // Dimension 1: Trigger Relevance (1-5)
  // High score if first sentence references specific trigger / timing
  let triggerScore = 3;
  if (firstSentence.length > 0) {
    const triggerTerms = ["saw that", "noticed", "expanding", "hiring", "launch", "recently", "growth", "initiative", "announced"];
    const hasTriggerTerm = triggerTerms.some((t) => firstSentence.toLowerCase().includes(t));
    const isGenericOpener = SELF_SERVING_INTROS.some((r) => r.test(firstSentence));
    
    if (hasTriggerTerm && !isGenericOpener) {
      triggerScore = 5;
    } else if (isGenericOpener) {
      triggerScore = 1;
    } else {
      triggerScore = 4;
    }
  } else {
    triggerScore = 1;
  }

  // Dimension 2: Problem Specificity (1-5)
  // Checks for concrete friction terms vs empty fluff
  let problemScore = 3;
  const problemTerms = ["friction", "bottleneck", "manual", "fragmented", "capacity", "delay", "leakage", "conversion", "follow-up", "inconsistent", "visibility", "slow"];
  const matchesProblemTerm = problemTerms.some((t) => input.body_generated.toLowerCase().includes(t));
  if (matchesProblemTerm) {
    problemScore = 5;
  } else if (sentences.length >= 2 && sentences[1].length > 15) {
    problemScore = 4;
  }

  // Dimension 3: Customer Centricity (1-5)
  // Ratio of second-person (you, your) vs first-person (we, our, us, I)
  const youCount = (fullText.match(/\b(you|your|yours)\b/gi) || []).length;
  const weCount = (fullText.match(/\b(we|our|us|i|my)\b/gi) || []).length;
  let customerScore = 4;
  if (weCount > youCount && weCount >= 3) {
    customerScore = 2;
  } else if (youCount >= 3 && weCount <= 2) {
    customerScore = 5;
  } else if (youCount > 0) {
    customerScore = 4;
  } else {
    customerScore = 2;
  }

  // Dimension 4: Future-State Clarity (1-5)
  let futureStateScore = 3;
  const futureTerms = ["increase", "faster", "more qualified", "visibility", "capacity", "clarity", "predictable", "consistent", "outcome", "pipeline"];
  if (futureTerms.some((t) => input.body_generated.toLowerCase().includes(t))) {
    futureStateScore = 5;
  } else if (sentences.length >= 3) {
    futureStateScore = 4;
  }

  // Dimension 5: Proof Relevance (1-5)
  let proofScore = 4;
  if (fabricatedMetrics.length > 0) {
    proofScore = 1;
  } else if (emailMetrics.length > 0 && fabricatedMetrics.length === 0) {
    proofScore = 5; // Verified proof cited cleanly
  } else {
    proofScore = 4; // Clean, unexaggerated copy without fake claims
  }

  // Dimension 6: Personalization Depth (1-5)
  let personalizationScore = 3;
  const hasSubjectLine = input.subject_line && input.subject_line.trim().length > 0;
  if (input.research && input.research.observed_facts.length > 0) {
    const matchedFacts = input.research.observed_facts.filter((f) =>
      input.body_generated.toLowerCase().includes(f.fact.toLowerCase().slice(0, 15))
    );
    if (matchedFacts.length > 0) {
      personalizationScore = 5;
    } else if (hasSubjectLine) {
      personalizationScore = 4;
    }
  } else if (hasSubjectLine) {
    personalizationScore = 4;
  }

  // Dimension 7: CTA Quality (1-5)
  let ctaScore = 3;
  const interestCtas = [/worth\s+(exploring|a\s+look|a\s+quick\s+chat)/i, /open\s+to\s+comparing/i, /curious\s+if/i, /would\s+it\s+be\s+useful/i, /worth\s+comparing/i, /open\s+to\s+seeing/i];
  const hasInterestCta = interestCtas.some((r) => r.test(input.body_generated));
  const hasHighFrictionCta = HIGH_FRICTION_CTAS.some((r) => r.test(input.body_generated));

  if (hasHighFrictionCta) {
    ctaScore = 1;
  } else if (hasInterestCta) {
    ctaScore = 5;
  } else if (input.body_generated.includes("?")) {
    ctaScore = 4;
  } else {
    ctaScore = 2;
  }

  // Dimension 8: Brevity & Conciseness (1-5)
  let brevityScore = 5;
  if (wordCount > 120 || sentenceCount > 5) {
    brevityScore = 1;
  } else if (sentenceCount === 4 && wordCount <= 85) {
    brevityScore = 5;
  } else if (sentenceCount <= 5 && wordCount <= 100) {
    brevityScore = 4;
  } else {
    brevityScore = 3;
  }

  // Dimension 9: Human Tone (1-5)
  let toneScore = 4;
  const hasRoboticBuzzword = ROBOTIC_BUZZWORDS.some((r) => r.test(input.body_generated));
  if (hasRoboticBuzzword) {
    toneScore = 2;
  } else if (GENERIC_GREETINGS.some((r) => r.test(input.body_generated)) || GENERIC_APOLOGIES.some((r) => r.test(input.body_generated))) {
    toneScore = 1;
  } else {
    toneScore = 5;
  }

  // Dimension 10: Factual Confidence (1-5)
  let factualScore = 5;
  if (fabricatedMetrics.length > 0) {
    factualScore = 1;
  } else if (mandatoryFailures.length > 0) {
    factualScore = 3;
  } else {
    factualScore = 5;
  }

  const dimension_scores: QAScoreBreakdown = {
    trigger_relevance: triggerScore,
    problem_specificity: problemScore,
    customer_centricity: customerScore,
    future_state_clarity: futureStateScore,
    proof_relevance: proofScore,
    personalization: personalizationScore,
    cta_quality: ctaScore,
    brevity: brevityScore,
    human_tone: toneScore,
    factual_confidence: factualScore,
  };

  const totalScore =
    triggerScore +
    problemScore +
    customerScore +
    futureStateScore +
    proofScore +
    personalizationScore +
    ctaScore +
    brevityScore +
    toneScore +
    factualScore;

  // Passing criteria: Total score >= 40 AND ZERO mandatory failures
  const passed = totalScore >= 40 && mandatoryFailures.length === 0;

  let feedback_notes: string | null = null;
  if (!passed) {
    const feedbackParts: string[] = [];
    if (mandatoryFailures.length > 0) {
      feedbackParts.push(`Mandatory Failures:\n- ${mandatoryFailures.join("\n- ")}`);
    }
    if (totalScore < 40) {
      feedbackParts.push(`Score ${totalScore}/50 is below passing threshold (40/50).`);
    }
    feedback_notes = feedbackParts.join("\n\n");
  }

  return {
    total_score: totalScore,
    passed,
    mandatory_failures: mandatoryFailures,
    dimension_scores,
    feedback_notes,
    sentence_count: sentenceCount,
    word_count: wordCount,
  };
}
