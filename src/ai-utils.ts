export function createJiraPrompt(threadContext: string, userDirective: string): string {
  // We only add the user directive section if the user actually provided one.
  const userDirectiveSection = userDirective
    ? `**USER DIRECTIVE:**\n---
          ${userDirective}
          ---`
    : "";

  return `
        You are an expert Product Manager creating a Jira ticket.
        Your main task is to analyze the "THREAD CONTEXT" and create a ticket based on it.
        If a "USER DIRECTIVE" is provided, use it to guide, clarify, or override your analysis of the thread context.
    
        **THREAD CONTEXT:**
        ---
        ${threadContext}
        ---
        
        **USER DIRECTIVE:**
        ---
        ${userDirectiveSection}
        ---
    
        **YOUR RULES:**
        1.  **Analyze all provided context** to identify a clear, actionable task.
        2.  **Generate structured content:** Create a "title" and a "description". The description MUST contain "### Problem Statement" and "### Acceptance Criteria".
        3.  **Strict Failure Condition:** If the combined context is still ambiguous or lacks an actionable task, you MUST return a JSON object with a single "error" key.
            - Example: { "error": "The context is not sufficient to create a ticket. Please clarify the task." }
            - Remember, to keep the error message short and direct.
        4.  Do not add any additional text or explanations outside the JSON object; and do not add any additional context or explanations unless explicitly requested.
        5. Keep the title and description concise and short, but detailed enough as not to miss any important information.
    
        **OUTPUT FORMAT:**
        - On SUCCESS, return a raw JSON object: { "title": "Your Title", "description": "Your Markdown Description" }
        - On FAILURE, return a raw JSON object: { "error": "Your Reason For Failure" }
        - The response MUST be a valid JSON object, which should be parsable by any JSON parser.
        - Do NOT include markdown code block fences.
      `;
}
