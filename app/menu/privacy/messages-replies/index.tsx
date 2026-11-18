import { ChoiceScreen } from "@/components/pref-screens";

export default function MessagesRepliesScreen() {
  return (
    <ChoiceScreen
      title="Messages and story replies"
      heading="Who can message you or reply to your stories"
      prefKey="privacy.messages"
      defaultValue="everyone"
      options={[
        { value: "everyone", title: "Everyone", detail: "Anyone on Mabiz can message you or reply to your stories" },
        { value: "followers", title: "People you follow", detail: "Only accounts you follow" },
        { value: "none", title: "No one", detail: "Nobody can message you or reply to your stories" },
      ]}
    />
  );
}
