import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, Switch, Text, View } from "react-native";
import { ActionTile, Button, ConfirmModal, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { t } from "@/i18n/translations";
import { useThemeContext } from "@/lib/theme-provider";
import { colors } from "@/theme/tokens";
import type { AppearanceMode } from "@/types/domain";
import { useMabizServices, useMabizServiceMode } from "@/lib/services/service-provider";

function feedback(message: string) { if (Platform.OS === "web") window.alert(message); else Alert.alert("Mabiz", message); }

function AppearanceSelector({ appearance, language, onChange, disabled }: { appearance: AppearanceMode; language: "en" | "sw"; onChange: (mode: AppearanceMode) => void; disabled: boolean }) {
  return <>
    <SectionTitle title={t("appearance", language)} />
    <View style={[styles.actionTile, { flexDirection: "column", alignItems: "stretch" }]}>
      <Text style={styles.caption}>{t("appearanceDetail", language)}</Text>
      <View style={styles.row}>
        {(["light", "dark"] as const).map((mode) => {
          const selected = appearance === mode;
          const label = mode === "light" ? t("lightMode", language) : t("darkMode", language);
          return <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(mode)}
            style={[styles.themeOption, selected && { backgroundColor: colors.emeraldTint, borderColor: colors.emerald }, disabled && { opacity: 0.55 }]}
          >
            <Ionicons name={mode === "light" ? "sunny-outline" : "moon-outline"} size={18} color={selected ? colors.emeraldDark : colors.muted} />
            <Text style={[styles.body, selected && { color: colors.emeraldDark, fontWeight: "700" }]}>{label}</Text>
          </Pressable>;
        })}
      </View>
    </View>
  </>;
}

export default function SettingsScreen() {
  const app = useAppStore();
    const services = useMabizServices();
  const serviceMode = useMabizServiceMode();
  const { setColorScheme } = useThemeContext();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
    const signOut = async () => {
    const result = await services.auth.logout();
    await app.setAuthenticated(false);
    feedback(result.ok ? "You are signed out." : "The server may not have received logout, but this device cleared its session. Please sign in again if needed.");
    router.replace("/auth");
  };
  const language = app.settings.language;
  const selectAppearance = (appearance: AppearanceMode) => {
    setColorScheme(appearance);
    app.updateSettings({ appearance });
  };
  const appearanceSelector = <AppearanceSelector appearance={app.settings.appearance} language={language} onChange={selectAppearance} disabled={!app.hasHydrated} />;
  const switchRow = (label: string, detail: string, value: boolean, onValueChange: (value: boolean) => void) => <View style={styles.actionTile}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{label}</Text><Text style={styles.caption}>{detail}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.emerald }} thumbColor={colors.white} /></View>;
 
  if (!app.isAuthenticated) return <Page>
    <TopBar title={t("appearance", language)} back />
    <LocalNote text={t("appearanceLocalOnly", language)} />
    {appearanceSelector}
    <ActionTile title={t("signIn", language)} detail={t("accountSettingsRequireSignIn", language)} icon="log-in-outline" onPress={() => router.push("/auth/login")} />
  </Page>;

  return <Page>
    <TopBar title="Settings" back />
    <LocalNote text="Preferences and account state are stored on this device." />
    {appearanceSelector}
    <SectionTitle title="Account" />
    <ActionTile title="Edit personal profile" icon="person-outline" onPress={() => router.push("/menu/account/edit-profile")} />
    <ActionTile title="Privacy & message permissions" icon="shield-checkmark-outline" onPress={() => router.push("/menu/privacy/profile-privacy")} />
    <ActionTile title="Security & password" detail="Request a code to change your password" icon="key-outline" onPress={() => router.push("/auth/forgot-password")} />
    <SectionTitle title="Language & access" />
    <View style={styles.actionTile}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{t("language", language)}</Text>
        <Text style={styles.caption}>English / Kiswahili · more markets can be added centrally</Text>
      </View>
      <View style={styles.row}>
        <Button title="English" small variant={language === "en" ? "soft" : "outline"} onPress={() => app.updateSettings({ language: "en" })} />
        <Button title="Kiswahili" small variant={language === "sw" ? "soft" : "outline"} onPress={() => app.updateSettings({ language: "sw" })} />
      </View>
    </View>
    {switchRow("Reduced data", "Use fewer background loads and defer media when available", app.settings.reducedData, (value) => app.updateSettings({ reducedData: value }))}
    {switchRow("Video autoplay", "Videos start only when you choose them by default", app.settings.autoplayVideos, (value) => app.updateSettings({ autoplayVideos: value }))}
    {serviceMode === "api"
      ? <ActionTile title="Notification delivery preferences" detail="Manage in-app, activity and Expo push settings for your account" icon="notifications-outline" onPress={() => router.push("/menu/activity/notification-settings")} />
      : switchRow("Sample notifications", "Local demo preference; no push device is registered in mock mode", app.settings.notifications, (value) => app.updateSettings({ notifications: value }))}
    <SectionTitle title="Your information" />

    <ActionTile title="Help centre & guidelines" icon="help-circle-outline" onPress={() => router.push("/menu/support/help")} />
    <ActionTile title="About Mabiz" detail="Version 1.0 · frontend demo" icon="information-circle-outline" onPress={() => router.push("/menu/support/about")} />
    <Button title="Sign out" icon="log-out-outline" variant="outline" onPress={() => setLogoutConfirm(true)} />
    <Text style={styles.caption}>Signing out ends your session on the server and on this device.</Text>
    <ConfirmModal visible={logoutConfirm} title="Sign out?" detail="You can browse public businesses while signed out. Interactions that require authentication will ask you to sign in again." confirmLabel="Sign out" onCancel={() => setLogoutConfirm(false)} onConfirm={() => { setLogoutConfirm(false); void signOut(); }} />
  </Page>;
}
