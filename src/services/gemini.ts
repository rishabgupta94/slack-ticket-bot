import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, THINKING_BUDGET } from "../global-consts.js";
import { createJiraPrompt } from "../ai-utils.js";

type GeminiResponse = {
  title: string;
  description: string;
};

type GeminiErrorResponse = {
  error: string;
};

const ai = new GoogleGenAI({}); // automatically uses the GEMINI_API_KEY from the environment variables

// Type-guard to check the AI response type
export function isGeminiResponse(response: any): response is GeminiResponse {
  return response && typeof response.title === "string" && typeof response.description === "string";
}

export function isGeminiErrorResponse(response: any): response is GeminiErrorResponse {
  return response && typeof response.error === "string";
}

export async function getGeminiSummary(context: string, userDirective: string) {
  const promptContent = createJiraPrompt(context, userDirective);

  console.log("🤖 Creating AI summary");
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: promptContent,
    config: {
      thinkingConfig: {
        thinkingBudget: THINKING_BUDGET,
      },
    },
  });

  // JSON parse the response text and return
  if (response.text) {
    try {
      const parsedResponse = JSON.parse(response.text);
      // Response could be a GeminiResponse or GeminiErrorResponse
      if (isGeminiErrorResponse(parsedResponse)) {
        console.log("AI error response:", parsedResponse.error);
        return parsedResponse;
      }

      if (isGeminiResponse(parsedResponse)) {
        console.log("AI response:", parsedResponse);
        return parsedResponse;
      }

      console.error("Unexpected AI response format:", parsedResponse);
      return;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return;
    }
  }

  console.error("Error generating content:");
}
