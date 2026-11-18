import { router } from "expo-router";
import { EmptyState, Page, TopBar } from "@/components/biz-ui";

export default function BlockedScreen() {
  return (
    <Page>
      <TopBar title="Blocked" back />
      <EmptyState
        title="No blocked accounts"
        detail="Accounts you block or restrict will appear here. Blocking needs server support, which isn't available yet."
        icon="ban-outline"
        action="Privacy settings"
        onAction={() => router.push("/menu/privacy/profile-privacy")}
      />
    </Page>
  );
}
