import { ChoiceScreen } from "@/components/pref-screens";

export default function TagsMentionsScreen() {
  return (
    <ChoiceScreen
      title="Tags and mentions"
      heading="Who can tag or @mention you"
      prefKey="privacy.tagsMentions"
      defaultValue="everyone"
      options={[
        { value: "everyone", title: "Everyone", detail: "Anyone on Mabiz can tag or mention you" },
        { value: "followers", title: "People you follow", detail: "Only accounts you follow" },
        { value: "none", title: "No one", detail: "Nobody can tag or mention you" },
      ]}
    />
  );
}
