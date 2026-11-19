import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

export default function ProfileStatusScreen() {
  useThemeContext();
  const app = useAppStore();
  return (
    <Page>
      <TopBar title="Profile status" back />
      <SectionTitle title="Account standing" />
      <View style={styles.actionTile}>
        <Ionicons name="checkmark-circle" size={26} color={colors.emerald} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>@{app.user.username}</Text>
          <Text style={styles.caption}>No community guideline violations. Your account is in good standing.</Text>
        </View>
      </View>
    </Page>
  );
}
