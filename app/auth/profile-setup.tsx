import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button, Chip, LocalNote, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";

const INTERESTS = ["Shopping", "Entrepreneurship", "Fashion", "Technology", "Food", "Beauty", "Agriculture", "Services", "Health & wellness", "Education"];
export default function ProfileSetupScreen() {
  const app = useAppStore();
  const [interests, setInterests] = useState(app.user.interests);
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { if (app.hasHydrated && app.onboardingStage !== "profile_setup") router.replace("/auth/register"); }, [app.hasHydrated, app.onboardingStage]);
  const finish = async () => {
    if (!interests.length) { setError("Choose at least one interest to finish setup."); return; }
    setSaving(true);
    const completed = await app.completeDemoOnboarding(interests);
    setSaving(false);
    if (completed) router.replace("/(tabs)"); else setError("Your demo verification has expired. Start registration again.");
  };
  return <Page><TopBar title="Set up your profile" back /><Text style={styles.sectionHeading}>What would you like to discover?</Text><Text style={styles.body}>Pick a few interests. You can change them whenever your plans change.</Text><LocalNote text="Interest choices are saved in this local demo profile. A local demo session starts only after this step." /><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{INTERESTS.map((item) => <Chip key={item} label={item} selected={interests.includes(item)} onPress={() => { setError(""); setInterests((items) => items.includes(item) ? items.filter((interest) => interest !== item) : [...items, item]); }} />)}</View>{error ? <Text style={[styles.caption, { color: "#B42318", fontWeight: "600" }]}>{error}</Text> : null}<View style={{ flex: 1 }} /><Button title={saving ? "Saving locally…" : "Finish profile setup"} disabled={saving} onPress={() => void finish()} /><Text style={styles.caption}>This creates a local demo session only. No account is created on a server.</Text></Page>;
}
