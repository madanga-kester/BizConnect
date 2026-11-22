import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, Switch, Text, View } from "react-native";
import { EmptyState, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useLocalPref } from "@/components/pref-screens";
import { useAppStore } from "@/hooks/use-app-store";
import type { MenuAudience, MenuSettings, MenuSettingsUpdate } from "@/lib/api/feature-contracts";
import { useMabizServices } from "@/lib/services/service-provider";

export function asAudience(value: string): MenuAudience {
  return value === "followers" || value === "none" ? value : "everyone";
}

function say(text: string): void {
  if (Platform.OS === "web") window.alert(text);
  else Alert.alert("Privacy settings", text);
}

function useRemoteMenuSettings() {
  const app = useAppStore();
  const services = useMabizServices();
  const [settings, setSettings] = useState<MenuSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!app.isAuthenticated) { setLoading(false); return; }
    void services.menu.getSettings().then((result) => {
      if (!alive) return;
      if (result.ok) setSettings(result.data);
      else setError(`${result.error.message} (${result.error.code})`);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [app.isAuthenticated, services.menu]);

  const save = useCallback(async (patch: MenuSettingsUpdate) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await services.menu.updateSettings(patch);
    if (result.ok) setSettings(result.data);
    else {
      const text = `${result.error.message} (${result.error.code})`;
      setError(text);
      say(text);
    }
    setBusy(false);
  }, [busy, services.menu]);

  return { signedIn: app.isAuthenticated, settings, loading, busy, error, save };
}

type RemoteState = ReturnType<typeof useRemoteMenuSettings>;

function Frame({ title, heading, state, children }: { title: string; heading?: string | undefined; state: RemoteState; children: (settings: MenuSettings) => ReactNode }) {
  if (!state.signedIn) {
    return <Page><TopBar title={title} back /><EmptyState title="Sign in to change this setting" detail="Privacy settings are saved to your Mabiz account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  }
  if (state.loading) return <Page><TopBar title={title} back /><ActivityIndicator style={{ marginTop: 24 }} /></Page>;
  if (!state.settings) {
    return <Page><TopBar title={title} back /><EmptyState title="Settings could not be loaded" detail={state.error ?? "Try again in a moment."} icon="alert-circle-outline" /></Page>;
  }
  return (
    <Page>
      <TopBar title={title} back />
      {heading ? <SectionTitle title={heading} /> : null}
      {children(state.settings)}
      {state.error ? <Text style={styles.caption}>{state.error}</Text> : null}
    </Page>
  );
}

type ChoiceOption = { value: string; title: string; detail?: string };

export function RemoteChoiceScreen({ title, heading, options, read, write }: {
  title: string;
  heading?: string;
  options: ChoiceOption[];
  read: (settings: MenuSettings) => string;
  write: (value: string) => MenuSettingsUpdate;
}) {
  const state = useRemoteMenuSettings();
  return (
    <Frame title={title} heading={heading} state={state}>
      {(settings) => options.map((option) => {
        const selected = read(settings) === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: state.busy }}
            disabled={state.busy}
            onPress={() => { if (!selected) void state.save(write(option.value)); }}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{option.title}</Text>
              {option.detail ? <Text style={styles.caption}>{option.detail}</Text> : null}
            </View>
            <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} />
          </Pressable>
        );
      })}
    </Frame>
  );
}

type ToggleItem = { key: string; title: string; detail?: string };
type LocalToggleItem = ToggleItem & { defaultValue: boolean };

function ToggleRow({ item, value, disabled, onChange }: { item: ToggleItem; value: boolean; disabled: boolean; onChange: (next: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.detail ? <Text style={styles.caption}>{item.detail}</Text> : null}
      </View>
      <Switch value={value} disabled={disabled} onValueChange={onChange} />
    </View>
  );
}

export function RemoteToggleScreen({ title, heading, items, read, write, localItems, localPrefKey }: {
  title: string;
  heading?: string;
  items: ToggleItem[];
  read: (settings: MenuSettings) => Record<string, boolean>;
  write: (key: string, value: boolean, settings: MenuSettings) => MenuSettingsUpdate | null;
  localItems?: LocalToggleItem[];
  localPrefKey?: string;
}) {
  const state = useRemoteMenuSettings();
  const [localStored, setLocalStored] = useLocalPref<Record<string, boolean>>(localPrefKey ?? "privacy.remote-unused", {});
  return (
    <Frame title={title} heading={heading} state={state}>
      {(settings) => {
        const values = read(settings);
        return (
          <>
            {items.map((item) => (
              <ToggleRow
                key={item.key}
                item={item}
                value={values[item.key] ?? false}
                disabled={state.busy}
                onChange={(next) => {
                  const patch = write(item.key, next, settings);
                  if (patch) void state.save(patch);
                }}
              />
            ))}
            {(localItems ?? []).map((item) => (
              <ToggleRow
                key={item.key}
                item={item}
                value={localStored[item.key] ?? item.defaultValue}
                disabled={false}
                onChange={(next) => setLocalStored({ ...localStored, [item.key]: next })}
              />
            ))}
          </>
        );
      }}
    </Frame>
  );
}