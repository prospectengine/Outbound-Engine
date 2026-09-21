import { z } from "zod";
import { ServiceError } from "@/services/errors";

export interface AIGeneratedDraft {
  subject_line: string;
  preview_text: string | null;
  body_generated: string;
  ps_text: string | null;
}

export interface AIProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  temperature?: number;
}

export interface PromptPayload {
  systemPrompt: string;
  userPrompt: string;
}

const aiDraftResponseSchema = z.object({
  subject_line: z
    .string()
    .trim()
    .min(1, "Subject line cannot be empty")
    .max(255, "Subject line exceeds maximum length of 255 characters"),
  preview_text: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  body_generated: z
    .string()
    .trim()
    .min(1, "Body copy cannot be empty"),
  ps_text: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

/**
 * Extracts and cleans JSON string from model response, handling potential markdown fences.
 */
function extractJsonString(rawText: string): string {
  const trimmed = rawText.trim();
  
  // Check for ```json ... ``` or ``` ... ``` code blocks
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  // Check if string contains { ... }
  const jsonBraceMatch = trimmed.match(/(\{[\s\S]*\})/);
  if (jsonBraceMatch && jsonBraceMatch[1]) {
    return jsonBraceMatch[1].trim();
  }

  return trimmed;
}

/**
 * Invokes the configured OpenAI-compatible NVIDIA NIM / Nemotron endpoint.
 * Throws ServiceError with code 'GENERATION_UNAVAILABLE' on any failure.
 * Under no circumstances does this function fall back to synthetic or canned templates.
 */
export async function callAIProvider(
  payload: PromptPayload,
  options?: AIProviderOptions
): Promise<AIGeneratedDraft> {
  const apiKey =
    options?.apiKey ||
    process.env.NVIDIA_NIM_API_KEY ||
    process.env.AI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new ServiceError(
      "ai-provider",
      "AI provider credentials are not configured. AI copywriting is unavailable.",
      "GENERATION_UNAVAILABLE"
    );
  }

  const rawBaseUrl =
    options?.baseUrl ||
    process.env.NVIDIA_NIM_BASE_URL ||
    "https://integrate.api.nvidia.com/v1";

  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const endpoint = `${baseUrl}/chat/completions`;

  const model =
    options?.model ||
    process.env.NVIDIA_NIM_MODEL ||
    "openai/gpt-oss-20b";

  const timeoutMs = options?.timeoutMs ?? 30000;
  const temperature = options?.temperature ?? 0.3;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: payload.systemPrompt },
          { role: "user", content: payload.userPrompt },
        ],
        temperature,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });
  } catch (fetchErr: unknown) {
    clearTimeout(timeoutId);
    const isAbort =
      fetchErr instanceof Error && fetchErr.name === "AbortError";
    const errorMsg = isAbort
      ? `AI provider request timed out after ${timeoutMs}ms.`
      : `AI provider connection failed: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`;

    throw new ServiceError(
      "ai-provider",
      errorMsg,
      "GENERATION_UNAVAILABLE",
      fetchErr
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorDetails: unknown = null;
    try {
      errorDetails = await response.json();
    } catch {
      try {
        errorDetails = await response.text();
      } catch {
        errorDetails = null;
      }
    }

    throw new ServiceError(
      "ai-provider",
      `AI provider returned HTTP status ${response.status} (${response.statusText})`,
      "GENERATION_UNAVAILABLE",
      { status: response.status, details: errorDetails }
    );
  }

  let responseData: {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  try {
    responseData = (await response.json()) as typeof responseData;
  } catch (jsonErr) {
    throw new ServiceError(
      "ai-provider",
      "Failed to parse AI provider JSON response payload.",
      "GENERATION_UNAVAILABLE",
      jsonErr
    );
  }

  const rawContent = responseData.choices?.[0]?.message?.content;
  if (!rawContent || typeof rawContent !== "string" || rawContent.trim().length === 0) {
    throw new ServiceError(
      "ai-provider",
      "AI provider returned an empty content choice.",
      "GENERATION_UNAVAILABLE",
      responseData
    );
  }

  // Parse structured draft from content
  const cleanedJsonStr = extractJsonString(rawContent);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleanedJsonStr);
  } catch (parseErr) {
    throw new ServiceError(
      "ai-provider",
      "AI provider output could not be parsed as valid JSON structured copy.",
      "GENERATION_UNAVAILABLE",
      { rawContent, parseError: parseErr instanceof Error ? parseErr.message : String(parseErr) }
    );
  }

  const validated = aiDraftResponseSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new ServiceError(
      "ai-provider",
      "AI provider output failed structured schema validation.",
      "GENERATION_UNAVAILABLE",
      { rawContent, zodErrors: validated.error.issues }
    );
  }

  return {
    subject_line: validated.data.subject_line,
    preview_text: validated.data.preview_text ?? null,
    body_generated: validated.data.body_generated,
    ps_text: validated.data.ps_text ?? null,
  };
}
