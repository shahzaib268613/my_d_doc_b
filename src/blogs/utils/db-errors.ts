/** Walk Drizzle/driver error causes for PostgreSQL unique violations (23505). */
export function isUniqueViolation(error: unknown): boolean {
  for (
    let current = error as { code?: string; cause?: unknown } | undefined;
    current;
    current = current.cause as typeof current
  ) {
    if (current.code === '23505') return true
  }
  return false
}
