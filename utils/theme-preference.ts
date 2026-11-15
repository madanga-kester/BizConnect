import type { AppSettings, AppearanceMode } from "@/types/domain";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  language: "en",
  appearance: "light",
  reducedData: false,
  autoplayVideos: false,
  messagePermissions: "everyone",
  hidePreciseLocation: true,
  privateProfile: false,
  notifications: true,
};

export function normalizeAppearance(value: unknown): AppearanceMode {
  return value === "dark" ? "dark" : "light";
}

export function hydrateAppSettings(defaults: AppSettings, persisted: unknown): AppSettings {
  const saved = typeof persisted === "object" && persisted !== null && !Array.isArray(persisted)
    ? persisted as Partial<AppSettings>
    : {};

  return {
    ...defaults,
    ...saved,
    appearance: normalizeAppearance(saved.appearance),
  };
}

/** Guests may save a non-sensitive visual preference, but no account setting. */
export function isAppearanceOnlyUpdate(settings: Partial<AppSettings>): boolean {
  const keys = Object.keys(settings);
  return keys.length === 1
    && keys[0] === "appearance"
    && (settings.appearance === "light" || settings.appearance === "dark");
}

type LocalAppStateSnapshot = {
  settings: AppSettings;
  hasHydrated: boolean;
  isAuthenticated: boolean;
  onboardingStage: string;
};

/** Keep durable settings in the local payload while excluding transient session/hydration state. */
export function serializeLocalAppState<T extends LocalAppStateSnapshot>(state: T): string {
  const {
    hasHydrated: _hasHydrated,
    isAuthenticated: _isAuthenticated,
    onboardingStage: _onboardingStage,
    ...persisted
  } = state;
  return JSON.stringify(persisted);
}
