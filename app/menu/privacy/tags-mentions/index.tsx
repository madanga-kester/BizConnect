import { RemoteChoiceScreen, asAudience } from "@/components/menu-settings-screens";
import { ChoiceScreen } from "@/components/pref-screens";
import { useMabizServiceMode } from "@/lib/services/service-provider";

const OPTIONS = [
  { value: "everyone", title: "Everyone", detail: "Anyone on Mabiz can tag or mention you" },
  { value: "followers", title: "People you follow", detail: "Only accounts you follow" },
  { value: "none", title: "No one", detail: "Nobody can tag or mention you" },
];

export default function TagsMentionsScreen() {
  const apiMode = useMabizServiceMode() === "api";
  if (apiMode) {
    return (
      <RemoteChoiceScreen
        title="Tags and mentions"
        heading="Who can tag or @mention you"
        options={OPTIONS}
        read={(settings) => settings.tagPermission}
        write={(value) => ({ tagPermission: asAudience(value), mentionPermission: asAudience(value) })}
      />
    );
  }
  return (
    <ChoiceScreen
      title="Tags and mentions"
      heading="Who can tag or @mention you"
      prefKey="privacy.tagsMentions"
      defaultValue="everyone"
      options={OPTIONS}
    />
  );
}