import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, THINKING_BUDGET } from "../global-consts.js";
import { createJiraPrompt } from "../ai-utils.js";
import { AppError, ErrorType } from "../errors.js";

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

  try {
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

    // Clean the response text to extract the JSON object
    const cleanedText = response.text ? response.text.match(/\{[\s\S]*\}/)?.[0] : null;

    if (cleanedText) {
      const parsedResponse = JSON.parse(cleanedText);
      // Response could be a GeminiResponse or GeminiErrorResponse
      if (isGeminiErrorResponse(parsedResponse)) {
        console.log("AI error response:", parsedResponse.error);
        return parsedResponse;
      } else if (isGeminiResponse(parsedResponse)) {
        return parsedResponse;
      }

      console.error("Unexpected AI response format:", parsedResponse);
      return;
    }
  } catch (error: any) {
    console.error("❌ An API error occurred while contacting Gemini.");

    const errorMessage =
      error.cause?.message || error.message || "An unknown API error occurred while contacting Gemini.";

    throw new AppError(ErrorType.GEMINI_API_ERROR, errorMessage, { originalError: error });
  }
}
