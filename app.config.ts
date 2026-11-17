import type { ExpoConfig } from "expo/config";

// Standalone Android Google Maps tiles require a key restricted to the app ID and signing
// certificate. Expo Go map usage does not require this project-specific plugin configuration.
// Keep the key out of source and omit the plugin until a restricted build-time value is supplied.
const optionalMapPlugin: NonNullable<ExpoConfig["plugins"]> = process.env.GOOGLE_MAPS_API_KEY
  ? [["react-native-maps", { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY }]]
  : [];

const env = {
  appName: "Mabiz",
  appSlug: "bizconnect",
  scheme: "mabiz",
  iosBundleId: "com.mabiz.app",
  androidPackage: "com.mabiz.app",
};

const publicRuntime = {
  ...((process.env.EAS_PROJECT_ID ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID)
    ? { eas: { projectId: process.env.EAS_PROJECT_ID ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID } }
    : {}),
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  apiMode: process.env.EXPO_PUBLIC_API_MODE === "api" ? "api" : "mock-local",
  apiVersionPrefix: process.env.EXPO_PUBLIC_API_VERSION_PREFIX ?? "/api/v1",
  ...(process.env.EXPO_PUBLIC_AUTH_REFRESH_PATH?.startsWith("/")
    ? { authRefreshPath: process.env.EXPO_PUBLIC_AUTH_REFRESH_PATH }
    : {}),
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  extra: publicRuntime,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#102A43",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-asset",
    "expo-font",
    "expo-image",
    "expo-router",
    "expo-secure-store",
    "expo-notifications",
    "expo-status-bar",
    "expo-web-browser",
    ...optionalMapPlugin,
    ["expo-image-picker", { photosPermission: "Allow Mabiz to select photos and videos for your local demo posts.", cameraPermission: "Allow Mabiz to take a photo for your local demo profile or post." }],
    ["expo-location", { locationWhenInUsePermission: "Allow Mabiz to use your approximate area for nearby business discovery. Precise location is not shown on your profile." }],
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#102A43",
        dark: {
          backgroundColor: "#102A43",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;