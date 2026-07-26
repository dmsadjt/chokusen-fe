export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Invalid username or password',
};

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? "Something went wrong";
}
