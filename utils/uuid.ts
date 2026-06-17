/**
 * Generate a UUID v4 string.
 */
export function uuid(): string {
  return crypto.randomUUID();
}
