import { apiConfig, type ApiMode } from "@/lib/api/config";

export type ServiceMode = ApiMode;

/** Reflects explicit runtime configuration; API mode never silently falls back to local data. */
export const activeServiceMode: ServiceMode = apiConfig.mode;
