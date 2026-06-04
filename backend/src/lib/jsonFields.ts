/** Normalize JSONB / legacy JSON text from DB rows. */
export function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') return JSON.parse(value) as T[];
  return [];
}

export function parseJsonObject<T extends Record<string, unknown>>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as T;
  if (typeof value === 'string') return JSON.parse(value) as T;
  return fallback;
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return 0;
}
