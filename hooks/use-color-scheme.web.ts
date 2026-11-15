import { useThemeContext } from "@/lib/theme-provider";

/** Web uses the same persisted, app-scoped appearance as the native screens. */
export function useColorScheme() {
  return useThemeContext().colorScheme;
}
