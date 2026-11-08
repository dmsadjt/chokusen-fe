export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid username or password',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export function getErrorMessage(code: unknown): string {
  if (typeof code === 'string' && code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[code as ErrorCode];
  }

  return "Something went wrong";
}

export function getApiErrorMessage(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body as { message: unknown };
    if (typeof message === 'string' && message) return message;
  }

  return getErrorMessage(body);
}
