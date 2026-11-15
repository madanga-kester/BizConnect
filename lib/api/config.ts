import Constants from "expo-constants";

export type ApiMode = "mock-local" | "api";

export interface ApiClientConfig {
  mode: ApiMode;
  baseUrl: string;
  timeoutMs: number;
  versionPrefix: string;
  allowInsecureHttp: boolean;
  authRefreshPath?: string;
}

const extra = Constants.expoConfig?.extra ?? {};
const configuredMode = extra.apiMode ?? process.env.EXPO_PUBLIC_API_MODE;
const timeoutFromEnv = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS);
const developmentBuild = typeof __DEV__ !== "undefined" && __DEV__;

/** Public endpoint settings only. Credentials and server secrets never belong in Expo extra. */
export const apiConfig: ApiClientConfig = Object.freeze({
  mode: configuredMode === "api" ? "api" : "mock-local",
  baseUrl: String(extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "").trim(),
  timeoutMs: Number.isFinite(timeoutFromEnv) && timeoutFromEnv >= 1_000 && timeoutFromEnv <= 120_000 ? timeoutFromEnv : 20_000,
  versionPrefix: String(extra.apiVersionPrefix ?? process.env.EXPO_PUBLIC_API_VERSION_PREFIX ?? "/api/v1").replace(/\/$/, ""),
  allowInsecureHttp: extra.apiAllowInsecureHttp === true || process.env.EXPO_PUBLIC_API_ALLOW_HTTP === "true" || developmentBuild,
  ...(typeof extra.authRefreshPath === "string" && extra.authRefreshPath.startsWith("/")
    ? { authRefreshPath: extra.authRefreshPath }
    : process.env.EXPO_PUBLIC_AUTH_REFRESH_PATH?.startsWith("/")
      ? { authRefreshPath: process.env.EXPO_PUBLIC_AUTH_REFRESH_PATH }
      : { authRefreshPath: "/auth/refresh" }),
});
