export enum ErrorType {
  JIRA_API_ERROR = "JIRA_API_ERROR",
  GEMINI_API_ERROR = "GEMINI_API_ERROR",
}

export class AppError extends Error {
  public readonly context?: any;

  constructor(name: ErrorType, message: string, context?: any) {
    super(message);
    this.name = name;
    this.context = context;
  }
}
