export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name; // Set the error name to the class name
  }
}

export class JiraApiError extends AppError {
  public readonly context?: any;

  constructor(message: string, context?: any) {
    super(message);
    this.context = context;
  }
}
