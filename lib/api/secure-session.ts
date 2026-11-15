import type { AuthTokenProvider } from "./http-client";
import type { AuthSession } from "./feature-contracts";

const NATIVE_SESSION_KEY = "bizconnect.api.session.v1";
let browserSession: AuthSession | null = null;

export interface SessionStorage {
  read(): Promise<AuthSession | null>;
  write(session: AuthSession): Promise<void>;
  clear(): Promise<void>;
}

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const session = value as Partial<AuthSession>;
    if (!session.user || typeof session.accessToken !== "string" || typeof session.refreshToken !== "string" || typeof session.expiresAt !== "string") return null;
    return session as AuthSession;
  } catch {
    return null;
  }
}

export class PlatformSessionStorage implements SessionStorage {
  private isBrowser(): boolean {
    return typeof document !== "undefined" && typeof window !== "undefined";
  }

  async read(): Promise<AuthSession | null> {
    if (this.isBrowser()) return browserSession;
    const SecureStore = await import("expo-secure-store");
    const raw = await SecureStore.getItemAsync(NATIVE_SESSION_KEY);
    return parseSession(raw);
  }

  async write(session: AuthSession): Promise<void> {
    if (this.isBrowser()) {
      browserSession = session;
      return;
    }
    const SecureStore = await import("expo-secure-store");
    await SecureStore.setItemAsync(NATIVE_SESSION_KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  async clear(): Promise<void> {
    if (this.isBrowser()) {
      browserSession = null;
      return;
    }
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(NATIVE_SESSION_KEY);
  }
}

export type RefreshSessionHandler = (refreshToken: string) => Promise<AuthSession | null>;

/** Secure bearer-token provider for API mode; no password or demo-session marker is persisted. */
export class SecureSessionTokenProvider implements AuthTokenProvider {
  private refreshHandler?: RefreshSessionHandler;
  private refreshInFlight: Promise<string | null> | null = null;

  constructor(
    private readonly storage: SessionStorage = new PlatformSessionStorage(),
    private readonly sessionExpired?: () => Promise<void> | void,
  ) {}

  setRefreshHandler(handler: RefreshSessionHandler): void {
    this.refreshHandler = handler;
  }

  async getSession(): Promise<AuthSession | null> {
    return this.storage.read();
  }

  async saveSession(session: AuthSession): Promise<void> {
    await this.storage.write(session);
  }

  async getAccessToken(): Promise<string | null> {
    return (await this.storage.read())?.accessToken ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    return (await this.storage.read())?.refreshToken ?? null;
  }

  refreshAccessToken(): Promise<string | null> {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = this.refreshFromStoredSession().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async refreshFromStoredSession(): Promise<string | null> {
    const session = await this.storage.read();
    if (!session?.refreshToken || !this.refreshHandler) return null;
    const refreshed = await this.refreshHandler(session.refreshToken);
    if (!refreshed) return null;
    await this.storage.write(refreshed);
    return refreshed.accessToken;
  }

  async clearTokens(): Promise<void> {
    await this.storage.clear();
  }

  async onSessionExpired(): Promise<void> {
    await this.sessionExpired?.();
  }
}
