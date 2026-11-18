import { ChoiceScreen } from "@/components/pref-screens";

export default function HideStoryScreen() {
  return (
    <ChoiceScreen
      title="Hide story"
      heading="Who can view your stories"
      prefKey="privacy.storyAudience"
      defaultValue="everyone"
      options={[
        { value: "everyone", title: "Everyone", detail: "Your personal and business stories are public" },
        { value: "followers", title: "Followers only", detail: "Only people who follow you" },
        { value: "hidden", title: "Hide my stories", detail: "Nobody else can view your stories" },
      ]}
    />
  );
}
