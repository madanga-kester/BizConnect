import { RemoteChoiceScreen, asAudience } from "@/components/menu-settings-screens";
import { ChoiceScreen } from "@/components/pref-screens";
import { useMabizServiceMode } from "@/lib/services/service-provider";

const OPTIONS = [
  { value: "everyone", title: "Everyone", detail: "Anyone on Mabiz can message you or reply to your stories" },
  { value: "followers", title: "People you follow", detail: "Only accounts you follow" },
  { value: "none", title: "No one", detail: "Nobody can message you or reply to your stories" },
];

export default function MessagesRepliesScreen() {
  const apiMode = useMabizServiceMode() === "api";
  if (apiMode) {
    return (
      <RemoteChoiceScreen
        title="Messages and story replies"
        heading="Who can message you or reply to your stories"
        options={OPTIONS}
        read={(settings) => settings.messagePermission}
        write={(value) => ({ messagePermission: asAudience(value), storyReplyPermission: asAudience(value) })}
      />
    );
  }
  return (
    <ChoiceScreen
      title="Messages and story replies"
      heading="Who can message you or reply to your stories"
      prefKey="privacy.messages"
      defaultValue="everyone"
      options={OPTIONS}
    />
  );
}