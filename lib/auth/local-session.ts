export interface SessionCredentialStore {
  getItem(): Promise<string | null>;
  setItem(value: string): Promise<void>;
  removeItem(): Promise<void>;
}

export const LOCAL_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function isSessionExpiryValid(value: string | null | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const expiresAt = Number(value);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function createLocalSessionManager(
  storage: SessionCredentialStore,
  clock: () => number = Date.now,
  ttlMs = LOCAL_SESSION_TTL_MS,
) {
  return {
    async open(): Promise<string> {
      const expiry = String(clock() + ttlMs);
      await storage.setItem(expiry);
      return expiry;
    },
    async isActive(): Promise<boolean> {
      return isSessionExpiryValid(await storage.getItem(), clock());
    },
    async close(): Promise<void> {
      await storage.removeItem();
    },
  };
}
