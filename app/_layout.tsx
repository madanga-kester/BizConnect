import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, StatusBar } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider, useThemeContext } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { AppStoreProvider, useAppStore } from "@/hooks/use-app-store";
import { BizConnectServicesProvider } from "@/lib/services/service-provider";
import { Page, ScreenSkeleton } from "@/components/biz-ui";
import { normalizeAppearance } from "@/utils/theme-preference";

import { NotificationSyncProvider } from "@/components/notification-sync";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

const PRIVATE_ROUTES = ["/messages", "/drafts", "/privacy", "/search-history", "/saved", "/saved-businesses", "/saved-opportunities", "/business-management", "/business-growth", "/catalog-management", "/team", "/verification", "/analytics", "/notifications", "/notification-settings", "/report", "/edit-profile", "/followers", "/data-export", "/delete-account", "/create-business", "/moderation-status", "/recently-viewed", "/create", "/(tabs)/create"];

function GuardedStack() {
  const app = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!app.hasHydrated) return;

    if (PRIVATE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) && !app.isAuthenticated) { router.replace("/auth/login"); return; }
    if (app.isAuthenticated && ["/auth/login", "/auth/register"].includes(pathname)) router.replace("/(tabs)");
  }, [app.hasHydrated, app.isAuthenticated, pathname, router]);
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /><Stack.Screen name="oauth/callback" /></Stack>;
}

function ThemeAwareApp() {
  const app = useAppStore();
  const hasHydrated = app.hasHydrated;
  const storedAppearance = app.settings.appearance;
  const updateSettings = app.updateSettings;
  const { colorScheme, setColorScheme } = useThemeContext();

  useEffect(() => {
    if (!hasHydrated) return;
    const appearance = normalizeAppearance(storedAppearance);
    if (colorScheme === appearance) return;
    setColorScheme(appearance);
    updateSettings({ appearance });
  }, [colorScheme, hasHydrated, setColorScheme, storedAppearance, updateSettings]);

  if (!hasHydrated) return <><StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} /><Page><ScreenSkeleton variant="feed" count={2} label="Loading BizConnect" /></Page></>;
  return <NotificationSyncProvider><><GuardedStack /><StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} /></></NotificationSyncProvider>;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BizConnectServicesProvider>
        <AppStoreProvider>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
              {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
              {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
              <ThemeAwareApp />
            </QueryClientProvider>
          </trpc.Provider>
        </AppStoreProvider>
      </BizConnectServicesProvider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
