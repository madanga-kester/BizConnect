import { ActionTile, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { router } from "expo-router";
import { Text } from "react-native";

export default function PrivacyCentreScreen() {
  return (
    <Page>
      <TopBar title="Privacy Centre" back />
      <Text style={styles.body}>Manage how Mabiz protects and uses your information.</Text>
      <SectionTitle title="Your controls" />
      <ActionTile title="Profile privacy" detail="Account visibility and data controls" icon="lock-closed-outline" onPress={() => router.push("/menu/privacy/profile-privacy")} />
              <ActionTile title="Password and security" detail="Request a code to change your password" icon="key-outline" onPress={() => router.push("/menu/account/password-security")} />
      <ActionTile title="Export your data" detail="Create a local JSON export" icon="download-outline" onPress={() => router.push("/menu/account/export-data")} />
      <ActionTile title="Delete account" detail="Remove this profile and stored state" icon="trash-outline" onPress={() => router.push("/menu/account/delete-account")} />
      <ActionTile title="Community guidelines" detail="What is and is not allowed on Mabiz" icon="document-text-outline" onPress={() => router.push("/community-guidelines")} />
    </Page>
  );
}
