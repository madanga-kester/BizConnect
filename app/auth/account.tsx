import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Button, Field, LocalNote, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import type { UserProfile } from "@/types/domain";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Mabiz account", message);
}

export default function Stage2AccountScreen() {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const setApiUser = app.setApiUser;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await services.users.getProfile("me");
    if (result.ok) {
      setProfile(result.data);
      await setApiUser(result.data);
      setName(result.data.name);
      setUsername(result.data.username);
      setBio(result.data.bio);
    } else {
      setError(result.error.message);
    }
    setLoading(false);
  }, [services, setApiUser]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    setBusy(true);
    const result = await services.users.updateMyProfile({ name: name.trim(), username: username.replace(/^@/, "").trim(), bio: bio.trim() });
    if (result.ok) {
      setProfile(result.data);
      await setApiUser(result.data);
      feedback("Your profile changes were saved to the Stage 2 backend.");
    } else {
      feedback(result.error.message);
    }
    setBusy(false);
  };

  const signOut = async () => {
    setBusy(true);
    const result = await services.auth.logout();
    await app.setAuthenticated(false);
    setBusy(false);
    if (!result.ok) feedback("The server may not have received logout, but this device cleared its API session. Please sign in again if needed.");
    router.replace("/auth");
  };

  return (
    <Page>
      <TopBar title="Stage 2 account" back />
      <LocalNote text="This screen reads and updates your server account profile. Feed, posts, messages, preferences and other app features still use local demo data." />
      {loading ? <Text style={styles.body}>Loading your server profile…</Text> : null}
      {error ? <View style={[styles.card, { borderColor: colors.orange }]}><Text style={styles.body}>{error}</Text><Button title="Retry" variant="outline" onPress={() => void load()} /><Button title="Back to sign in" variant="quiet" onPress={() => router.replace("/auth/login")} /></View> : null}
      {profile ? <>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>@{profile.username}</Text>
          <Text style={styles.caption}>{profile.county} · {profile.town}</Text>
          {profile.email ? <Text style={styles.caption}>{profile.email}</Text> : null}
          {profile.phone ? <Text style={styles.caption}>{profile.phone}</Text> : null}
        </View>
        <Field label="Full name" value={name} onChangeText={setName} />
        <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Field label="Biography" value={bio} onChangeText={setBio} multiline placeholder="What would you like people to know?" />
        <Button title={busy ? "Saving…" : "Save server profile"} disabled={busy || loading} onPress={() => void save()} />
        <Button title="Continue to Mabiz" variant="soft" onPress={() => router.replace("/(tabs)")} />
      </> : null}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Local demo remains separate</Text>
        <Text style={styles.caption}>This backend session is stored using the platform's secure session storage. The rest of the app is not yet backed by Stage 2 and remains on-device demo data.</Text>
      </View>
      <Button title={busy ? "Signing out…" : "Sign out of backend"} variant="outline" disabled={busy} onPress={() => void signOut()} />
    </Page>
  );
}
