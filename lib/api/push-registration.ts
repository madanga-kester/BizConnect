import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

const INSTALLATION_ID_KEY = "bizconnect.notification-installation-id.v1";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
});

export interface ExpoPushRegistration {
  deviceIdentifier: string;
  platform: "ios" | "android";
  deviceName?: string;
  pushToken: string;
}

function newInstallationId(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return `install-${cryptoApi.randomUUID()}`;
  return `install-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 22)}`;
}

/** Requests permission only after an explicit user action; web and simulators are handled without throwing. */
export async function getExpoPushRegistration(): Promise<ExpoPushRegistration> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") throw new Error("Push notifications are available in the iOS and Android apps only.");
  if (!Device.isDevice) throw new Error("Push notification registration requires a physical device.");

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") throw new Error("Notification permission was not granted on this device.");

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error("Expo Push is not configured for this app build (missing EAS project ID).");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "BizConnect notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  let deviceIdentifier = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (!deviceIdentifier) {
    deviceIdentifier = newInstallationId();
    await SecureStore.setItemAsync(INSTALLATION_ID_KEY, deviceIdentifier);
  }
  return {
    deviceIdentifier,
    platform: Platform.OS,
    ...(Device.deviceName ? { deviceName: Device.deviceName.slice(0, 100) } : {}),
    pushToken: token,
  };
}

export function addPushNotificationResponseListener(listener: (data: Record<string, unknown>) => void): { remove(): void } {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data: unknown = response.notification.request.content.data;
    if (data && typeof data === "object" && !Array.isArray(data)) listener(data as Record<string, unknown>);
  });
  return subscription;
}

export async function getLastPushNotificationResponse(): Promise<Record<string, unknown> | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  const data: unknown = response?.notification.request.content.data;
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : null;
}
