import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Button, Field, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useThemeContext } from "@/lib/theme-provider";
function feedback(message: string) { if (Platform.OS === "web") window.alert(message); else Alert.alert("Help centre", message); }
const FAQ = [
  ["How do I create a business profile?", "Open Profile → Create business. Complete the six-step form and save locally. In this frontend demo the profile is not sent to a backend."],
  ["Does Mabiz process payments?", "No. Contact sellers directly through the profile or product page. No checkout, cart or payment gateway is implemented."],
  ["What does a verified badge mean here?", "Only a sample explicitly marked approved shows a badge. Submitting a demo request never verifies a business; real review requires the future backend team."],
  ["How do I control location privacy?", "Use Account privacy to hide precise location. Nearby discovery uses a selected county/town and requests device permission only when that feature is invoked."],
];
export default function HelpScreen() { const [message, setMessage] = useState(""); useThemeContext(); return <Page><TopBar title="Help centre" back /><LocalNote text="Help content is available offline; no support ticket is submitted from this demo." /><SectionTitle title="Common questions" />{FAQ.map(([q, a]) => <View key={q} style={[styles.card, { padding: 14, gap: 7 }]}><Text style={styles.cardTitle}>{q}</Text><Text style={styles.body}>{a}</Text></View>)}<SectionTitle title="Need more help?" /><Field label="Your question" value={message} onChangeText={setMessage} placeholder="Tell us what you need help with…" multiline /><Button title="Save feedback locally" icon="chatbubble-ellipses-outline" onPress={() => { if (message.trim().length < 8) return feedback("Add a little detail so your question is clear."); setMessage(""); feedback("Feedback saved only in this screen session. No support ticket or email was sent."); }} /><Button title="Community guidelines" variant="outline" onPress={() => import("expo-router").then(({ router }) => router.push("/community-guidelines"))} /></Page>; }
