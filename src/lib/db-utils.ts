/**
 * Build a partial update object from input data, picking only defined keys.
 * Eliminates repetitive `if (data.field !== undefined) values.field = data.field` patterns.
 */
export function buildPartialUpdate<T extends Record<string, unknown>>(
  data: Partial<T>,
  allowedKeys: readonly (keyof T & string)[],
  defaults?: Record<string, unknown>
): Record<string, unknown> {
  const values: Record<string, unknown> = { ...defaults };
  for (const key of allowedKeys) {
    if (data[key] !== undefined) {
      values[key] = data[key];
    }
  }
  return values;
}
