import { createOpenAI } from "@ai-sdk/openai";

/**
 * Lovable AI Gateway provider for OpenAI models served through the
 * Responses API (`/v1/responses`) — required for the GPT-5.6 family.
 */
export function createLovableResponsesProvider(apiKey: string) {
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export const DECK_MODEL = "openai/gpt-5.6-sol";
