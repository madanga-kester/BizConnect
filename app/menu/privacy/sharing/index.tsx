import { RemoteToggleScreen } from "@/components/menu-settings-screens";
import { ToggleScreen } from "@/components/pref-screens";
import { useMabizServiceMode } from "@/lib/services/service-provider";

const ITEMS = [
  { key: "reshare", title: "Allow resharing of posts", detail: "Others can reshare your posts to their profile" },
  { key: "storyShare", title: "Allow sharing of stories", detail: "Others can share your stories in messages" },
  { key: "external", title: "Allow sharing outside Mabiz", detail: "Posts can be shared as links to other apps" },
];

export default function SharingScreen() {
  const apiMode = useMabizServiceMode() === "api";
  if (apiMode) {
    return (
      <RemoteToggleScreen
        title="Sharing"
        heading="Resharing and sharing"
        items={ITEMS}
        read={(settings) => ({ reshare: settings.allowPostResharing, storyShare: settings.allowStorySharing, external: settings.allowExternalSharing })}
        write={(key, value) => {
          if (key === "reshare") return { allowPostResharing: value };
          if (key === "storyShare") return { allowStorySharing: value };
          if (key === "external") return { allowExternalSharing: value };
          return null;
        }}
      />
    );
  }
  return (
    <ToggleScreen
      title="Sharing"
      heading="Resharing and sharing"
      prefKey="privacy.sharing"
      items={ITEMS.map((item) => ({ ...item, defaultValue: true }))}
    />
  );
}