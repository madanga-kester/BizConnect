import { createContext, useContext } from "react";
import { apiConfig, type ApiClientConfig, type ApiMode } from "@/lib/api/config";
import type { MabizServices } from "@/lib/api/feature-contracts";
import { createApiServices } from "@/lib/api/production-services";
import { createMockServices } from "@/lib/services/mock-services";

export interface ServiceRegistryValue {
  mode: ApiMode;
  services: MabizServices;
}

export function createServiceRegistry(mode: ApiMode = apiConfig.mode, config: ApiClientConfig = apiConfig): ServiceRegistryValue {
  if (mode === "api") {
    // API errors remain errors; this factory never falls back to local successes.
    return { mode, services: createApiServices({ config: { ...config, mode } }) };
  }
  return { mode: "mock-local", services: createMockServices() };
}

const defaultRegistry = createServiceRegistry();
const ServicesContext = createContext<ServiceRegistryValue>(defaultRegistry);

export function MabizServicesProvider({
  children,
  registry = defaultRegistry,
}: {
  children: React.ReactNode;
  registry?: ServiceRegistryValue;
}) {
  return <ServicesContext.Provider value={registry}>{children}</ServicesContext.Provider>;
}

export function useMabizServices(): MabizServices {
  return useContext(ServicesContext).services;
}

export function useMabizServiceMode(): ApiMode {
  return useContext(ServicesContext).mode;
}

export const defaultServiceRegistry = defaultRegistry;
