import { router } from "expo-router";
import { useCallback } from "react";
import { useAppStore } from "@/hooks/use-app-store";

/** Run an interaction only for an authenticated local demo session. */
export function useRequireAuth() {
  const { isAuthenticated } = useAppStore();
  return useCallback((action: () => void) => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    action();
  }, [isAuthenticated]);
}
