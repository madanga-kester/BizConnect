import { router } from "expo-router";
import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { ActionTile, Avatar, Button, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { PEOPLE } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
const PERMISSIONS = ["everyone", "following", "nobody"] as const;
export default function PrivacyScreen() {
  const app = useAppStore(); const [messagePermission, setMessagePermission] = useState(app.settings.messagePermissions);
  const switchRow = (title: string, detail: string, value: boolean, change: (v: boolean) => void) => <View style={styles.actionTile}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.caption}>{detail}</Text></View><Switch value={value} onValueChange={change} trackColor={{ false: colors.border, true: colors.emerald }} thumbColor={colors.white} /></View>;
  return <Page><TopBar title="Account privacy" back /><LocalNote text="These frontend privacy controls affect this device's demo data only." />
    <SectionTitle title="Personal profile" />{switchRow("Private profile", "Limit who can view personal profile content", app.settings.privateProfile, (value) => app.updateSettings({ privateProfile: value }))}{switchRow("Hide precise personal location", "Show only a public town/county; do not display coordinates", app.settings.hidePreciseLocation, (value) => app.updateSettings({ hidePreciseLocation: value }))}
    <SectionTitle title="Who can message you?" />{PERMISSIONS.map((item) => <Button key={item} title={item === "everyone" ? "Everyone" : item === "following" ? "People you follow" : "Nobody"} icon={messagePermission === item ? "radio-button-on" : "radio-button-off"} variant={messagePermission === item ? "soft" : "outline"} small onPress={() => { setMessagePermission(item); app.updateSettings({ messagePermissions: item }); }} />)}
    <Text style={styles.caption}>Location permission is requested only when you choose a location-based feature. Precise coordinates are not stored in this UI.</Text>
    <SectionTitle title="Blocked users" />{app.blockedUsers.length ? app.blockedUsers.map((id) => { const person = PEOPLE.find((p) => p.id === id); return <View key={id} style={styles.actionTile}><Avatar name={person?.name ?? "BizConnect user"} size={35} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{person?.name ?? "User"}</Text><Text style={styles.caption}>Blocked in this local demo</Text></View><Button title="Unblock" variant="outline" small onPress={() => app.toggleBlock(id)} /></View>; }) : <Text style={styles.caption}>No blocked users.</Text>}
    <SectionTitle title="Privacy tools" /><ActionTile title="Export personal data" icon="download-outline" onPress={() => router.push("/data-export")} /><ActionTile title="Delete account" icon="trash-outline" onPress={() => router.push("/delete-account")} />
  </Page>;
}
