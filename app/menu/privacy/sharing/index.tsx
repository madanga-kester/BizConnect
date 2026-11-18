import { ToggleScreen } from "@/components/pref-screens";

export default function SharingScreen() {
  return (
    <ToggleScreen
      title="Sharing"
      heading="Resharing and sharing"
      prefKey="privacy.sharing"
      items={[
        { key: "reshare", title: "Allow resharing of posts", detail: "Others can reshare your posts to their profile", defaultValue: true },
        { key: "storyShare", title: "Allow sharing of stories", detail: "Others can share your stories in messages", defaultValue: true },
        { key: "external", title: "Allow sharing outside Mabiz", detail: "Posts can be shared as links to other apps", defaultValue: true },
      ]}
    />
  );
}
