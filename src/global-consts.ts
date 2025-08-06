export const GEMINI_MODEL = "gemini-2.5-flash";

export const THINKING_BUDGET = -1; // dynamic thinking budget

export const prompt = (context: string) => `
Based on the following Slack conversation, create a Jira ticket.
You are a product manager. Provide a concise, descriptive title and a detailed description in markdown format. This description will directly be used in the JIRA ticket,
so ensure that it clearly writes the steps and the problem, instead of just summarizing the conversation. 
Return ONLY a raw JSON object with two keys: "title" and "description". Do not include markdown code block fences like \`\`\`json.

Conversation Context:
---
${context}
---
`;
