import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, THINKING_BUDGET } from "../global-consts.js";

const ai = new GoogleGenAI({}); // automatically uses the GEMINI_API_KEY from the environment variables

export async function getGeminiSummary(context: string) {
  const promptContent = prompt(context);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: "promptContent",
    config: {
      thinkingConfig: {
        thinkingBudget: THINKING_BUDGET,
      },
    },
  });

  if (response.text) {
    return response.text;
  }

  console.error("Error generating content:");
}
