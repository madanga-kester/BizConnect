import { RemoteToggleScreen } from "@/components/menu-settings-screens";
import { ToggleScreen } from "@/components/pref-screens";
import { useMabizServiceMode } from "@/lib/services/service-provider";

const ALLOW = { key: "allow", title: "Allow comments on new posts", detail: "Turn off to disable comments by default" };
const FILTER = { key: "filter", title: "Hide offensive comments", detail: "Filter comments that may be abusive" };
const FOLLOWERS_ONLY = { key: "followersOnly", title: "Only followers can comment", detail: "People you don't have a connection with can't comment" };

export default function CommentsScreen() {
  const apiMode = useMabizServiceMode() === "api";
  if (apiMode) {
    return (
      <RemoteToggleScreen
        title="Comments"
        heading="Comment controls"
        items={[ALLOW, FOLLOWERS_ONLY]}
        localItems={[{ ...FILTER, defaultValue: true }]}
        localPrefKey="privacy.comments"
        read={(settings) => ({ allow: settings.commentPermission !== "none", followersOnly: settings.commentPermission === "followers" })}
        write={(key, value, settings) => {
          if (key === "allow") return { commentPermission: value ? (settings.commentPermission === "none" ? "everyone" : settings.commentPermission) : "none" };
          if (key === "followersOnly") return { commentPermission: value ? "followers" : (settings.commentPermission === "none" ? "none" : "everyone") };
          return null;
        }}
      />
    );
  }
  return (
    <ToggleScreen
      title="Comments"
      heading="Comment controls"
      prefKey="privacy.comments"
      items={[
        { ...ALLOW, defaultValue: true },
        { ...FILTER, defaultValue: true },
        { ...FOLLOWERS_ONLY, defaultValue: false },
      ]}
    />
  );
}