let localSequence = 0;

/** Generate a device-local identifier for a user-triggered mock operation. */
export function newLocalId(prefix: string): string {
  localSequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${localSequence.toString(36)}`;
}
