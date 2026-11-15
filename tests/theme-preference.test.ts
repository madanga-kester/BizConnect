import { afterEach, describe, expect, it } from "vitest";
import type { AppSettings } from "@/types/domain";
import { colors, createThemedStyles, getTabBarColors, setBizConnectColorScheme } from "@/theme/tokens";
import { DEFAULT_APP_SETTINGS, hydrateAppSettings, isAppearanceOnlyUpdate, normalizeAppearance, serializeLocalAppState } from "@/utils/theme-preference";

const defaultSettings: AppSettings = { ...DEFAULT_APP_SETTINGS };

afterEach(() => setBizConnectColorScheme("light"));

describe("theme preference", () => {
  it("defaults missing or invalid legacy appearance values to Light", () => {
    expect(normalizeAppearance(undefined)).toBe("light");
    expect(normalizeAppearance("system")).toBe("light");
    expect(hydrateAppSettings(defaultSettings, { reducedData: true, language: "sw" })).toEqual({
      ...defaultSettings,
      reducedData: true,
      language: "sw",
    });
  });

  it("retains a valid Dark preference and preserves the rest of saved settings", () => {
    expect(hydrateAppSettings(defaultSettings, { appearance: "dark", notifications: false })).toEqual({
      ...defaultSettings,
      appearance: "dark",
      notifications: false,
    });
  });

  it("keeps Dark in the signed-out local save payload and rehydrates it on the next launch", () => {
    const serialized = serializeLocalAppState({
      settings: { ...defaultSettings, appearance: "dark" },
      savedBusinesses: ["b-asili"],
      hasHydrated: true,
      isAuthenticated: false,
      onboardingStage: "idle",
    });
    const persisted = JSON.parse(serialized) as { settings: AppSettings; savedBusinesses: string[] };

    expect(persisted.settings.appearance).toBe("dark");
    expect(persisted.savedBusinesses).toEqual(["b-asili"]);
    expect(persisted).not.toHaveProperty("isAuthenticated");
    expect(persisted).not.toHaveProperty("hasHydrated");
    expect(persisted).not.toHaveProperty("onboardingStage");
    expect(hydrateAppSettings(DEFAULT_APP_SETTINGS, persisted.settings).appearance).toBe("dark");
    expect(DEFAULT_APP_SETTINGS.appearance).toBe("light");
  });

  it("allows only an appearance change outside an authenticated session", () => {
    expect(isAppearanceOnlyUpdate({ appearance: "dark" })).toBe(true);
    expect(isAppearanceOnlyUpdate({ appearance: "light" })).toBe(true);
    expect(isAppearanceOnlyUpdate({ appearance: "dark", language: "en" })).toBe(false);
    expect(isAppearanceOnlyUpdate({ reducedData: true })).toBe(false);
    expect(isAppearanceOnlyUpdate({ appearance: "system" as AppSettings["appearance"] })).toBe(false);
  });

  it("uses black navigation and neutral charcoal surfaces in Dark", () => {
    const styles = createThemedStyles(() => ({ surface: colors.surface, foreground: colors.ink }));
    const lightSurface = styles.surface;

    expect(getTabBarColors("light")).toEqual({ backgroundColor: "#FFFFFF", borderTopColor: "#E5E9E6" });
    setBizConnectColorScheme("dark");
    expect(colors.emeraldFill).toBe("#0C8366");
    expect(colors.canvas).toBe("#000000");
    expect(colors.subtle).toBe("#141414");
    expect(styles.surface).not.toBe(lightSurface);
    expect(styles.surface).toBe("#0A0A0A");
    expect(styles.foreground).toBe("#F5F5F5");
    expect(getTabBarColors("dark")).toEqual({ backgroundColor: "#000000", borderTopColor: "#262626" });

    setBizConnectColorScheme("light");
    expect(styles.surface).toBe("#FFFFFF");
  });
});
