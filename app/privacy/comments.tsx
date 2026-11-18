import { ToggleScreen } from "@/components/pref-screens";

export default function CommentsScreen() {
  return (
    <ToggleScreen
      title="Comments"
      heading="Comment controls"
      prefKey="privacy.comments"
      items={[
        { key: "allow", title: "Allow comments on new posts", detail: "Turn off to disable comments by default", defaultValue: true },
        { key: "filter", title: "Hide offensive comments", detail: "Filter comments that may be abusive", defaultValue: true },
        { key: "followersOnly", title: "Only followers can comment", detail: "People you don't have a connection with can't comment", defaultValue: false },
      ]}
    />
  );
}
