import { z } from 'zod';

/** Human-readable message from Zod safeParse failure (for JSON `error` string field). */
export function zodErrorMessage(error: z.ZodError): string {
  const flat = error.flatten();
  const parts: string[] = [...flat.formErrors];
  for (const [field, messages] of Object.entries(flat.fieldErrors)) {
    for (const m of messages ?? []) {
      parts.push(`${field}: ${m}`);
    }
  }
  return parts.join('; ') || 'Validation failed';
}

/** Optional evidence link: empty omitted; bare domains get https:// prepended. */
export const optionalEvidenceUrl = z.preprocess(
  (val) => {
    if (val == null || val === '') return undefined;
    if (typeof val !== 'string') return val;
    const t = val.trim();
    if (t === '') return undefined;
    if (!/^https?:\/\//i.test(t)) return `https://${t}`;
    return t;
  },
  z.string().url().optional(),
);
