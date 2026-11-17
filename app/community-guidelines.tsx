import { Text, View } from "react-native";
import { LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useThemeContext } from "@/lib/theme-provider";
import { colors } from "@/theme/tokens";
const GUIDELINES = [
  ["Respect people and communities", "No harassment, threats, hate speech, discrimination or sharing private personal information without consent."],
  ["Be clear about claims", "Describe products and services honestly. Do not present estimates, personal experience or user-submitted stories as independently verified facts."],
  ["Protect customers", "Do not request passwords, banking credentials or unnecessary personal information in comments or messages."],
  ["Share responsibly", "Use media you have permission to share. Give context to images and avoid misleading edits or impersonation."],
  ["Keep business conversations constructive", "No scams, counterfeit goods, unlawful goods or deceptive offers. Contact sellers directly and make your own checks."],
];
export default function GuidelinesScreen() { useThemeContext(); return <Page><TopBar title="Community guidelines" back /><LocalNote text="Guidelines in this frontend demo; reports are not sent to a moderation team." /><Text style={styles.body}>Mabiz is a place to discover local businesses and learn from each other&apos;s work. Help keep it useful, safe and honest.</Text>{GUIDELINES.map(([title, detail], index) => <View key={title} style={[styles.card, { padding: 14, gap: 7 }]}><View style={styles.row}><View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.emeraldTint, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.emeraldDark, fontWeight: "800" }}>{index + 1}</Text></View><Text style={styles.cardTitle}>{title}</Text></View><Text style={styles.body}>{detail}</Text></View>)}<SectionTitle title="See something concerning?" /><Text style={styles.body}>Use Report on the relevant post, video, business or profile. In the demo, reports are recorded locally for interface review; a future moderation service must review them.</Text></Page>; }
