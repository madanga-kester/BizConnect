import { router } from "expo-router";
import { Text, View } from "react-native";
import { ActionTile, Avatar, Divider, EmptyState, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useThemeContext } from "@/lib/theme-provider";

function DetailRow({ label, value }: { label: string; value: string }) {
  useThemeContext();
  return (
    <View style={{ gap: 3 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.body}>{value || "Not set"}</Text>
    </View>
  );
}

export default function PersonalDetailsScreen() {
  useThemeContext();
  const app = useAppStore();

  if (!app.isAuthenticated) {
    return (
      <Page>
        <TopBar title="Personal details" back />
        <EmptyState
          title="Sign in to view your personal details"
          detail="Your profile belongs to your local demo account."
          icon="lock-closed-outline"
          action="Sign in"
          onAction={() => router.push("/auth/login")}
        />
      </Page>
    );
  }

  return (
    <Page>
      <TopBar title="Personal details" back />
      <View style={{ alignItems: "center", gap: 8 }}>
        <Avatar name={app.user.name} image={app.user.avatar} size={76} />
        <Text style={styles.sectionHeading}>{app.user.name}</Text>
        <Text style={styles.caption}>@{app.user.username}</Text>
      </View>
      <DetailRow label="Full name" value={app.user.name} />
      <Divider />
      <DetailRow label="Username" value={`@${app.user.username}`} />
      <Divider />
      <DetailRow label="Biography" value={app.user.bio} />
      <Divider />
      <DetailRow label="County" value={app.user.county} />
      <Divider />
      <DetailRow label="Town" value={app.user.town} />
      <ActionTile
        title="Privacy Centre"
        detail="Learn how Mabiz protects and manages your information"
        icon="shield-checkmark-outline"
        onPress={() => router.push("/menu/support/privacy-centre")}
      />
    </Page>
  );
}