export const LIMIT = 20;
export const pageRequest = (cursor?: string) => ({ cursor, limit: LIMIT });
export const errorText = (error: { message: string; code?: string }) =>
  `${error.message}${error.code ? ` (${error.code})` : ""}`;