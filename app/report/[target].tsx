import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Chip, ConfirmModal, EmptyState, Field, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { PEOPLE } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { isPostVisible, profileRestriction } from "@/utils/privacy-policy";
const REASONS = ["Spam or scam", "Harassment or hate", "False or misleading claims", "Inappropriate content", "Intellectual property concern", "Safety concern", "Other"];
const TITLES: Record<string, string> = { post: "Report post", video: "Report video", business: "Report business", user: "Report user", comment: "Report comment" };
export default function ReportScreen() {
  const { target = "post" } = useLocalSearchParams<{ target: string }>(); const app = useAppStore(); const [reason, setReason] = useState(""); const [details, setDetails] = useState(""); const [submitted, setSubmitted] = useState(false); const [confirmType, setConfirmType] = useState<"block" | "hide" | undefined>();
  const kind = target.includes(":") ? target.split(":")[0] : target; const contentId = typeof target === "string" && target.includes(":") ? target.split(":")[1] : target; const title = TITLES[kind] ?? "Report content";
  const submit = () => { if (!app.isAuthenticated) return router.push("/auth/login"); if (!reason) return; app.addReport(target, reason, details.trim()); setSubmitted(true); };
  const targetParts = target.split(":");
  const reportedPostId = kind === "comment" ? targetParts[3] : contentId;
  const post = app.posts.find((item) => item.id === reportedPostId);
  const business = kind === "business" ? app.businesses.find((item) => item.id === contentId) : undefined;
  const person = kind === "user" ? PEOPLE.find((item) => item.id === contentId) : undefined;
  const comment = kind === "comment" ? post?.comments.find((item) => item.id === contentId) : undefined;
  const commentAuthorId = kind === "comment" ? targetParts[2] : undefined;
  const commenter = commentAuthorId ? PEOPLE.find((item) => item.id === commentAuthorId) : undefined;
  const visiblePost = Boolean(post && isPostVisible(post, { viewerId: app.user.id, people: [...PEOPLE.filter((item) => item.id !== app.user.id), app.user], businesses: app.businesses, blockedUserIds: app.blockedUsers, hiddenPostIds: app.hiddenPosts, followedPeople: app.followedPeople }));
  const businessOwner = kind === "business" ? business?.ownerId : undefined;
  const commenterVisible = !commentAuthorId || (!app.blockedUsers.includes(commentAuthorId) && (!commenter || !profileRestriction(commenter, app.user.id, app.followedPeople, app.blockedUsers)));
  const targetVisible = kind === "business" ? Boolean(business && !app.blockedUsers.includes(business.ownerId)) : kind === "user" ? Boolean(person && !profileRestriction(person, app.user.id, app.followedPeople, app.blockedUsers)) : kind === "comment" ? Boolean(visiblePost && comment && commenterVisible) : kind === "post" || kind === "video" ? Boolean(visiblePost && (kind !== "video" || post?.video || post?.kind === "video")) : false;
  const targetUser = kind === "user" ? contentId : kind === "comment" ? commentAuthorId ?? contentId : post?.authorId ?? businessOwner ?? contentId;
  const confirmAction = () => { if (confirmType === "block") app.toggleBlock(targetUser); if (confirmType === "hide") app.hidePost(contentId); setConfirmType(undefined); };
  if (!targetVisible) return <Page><TopBar title={title} back /><EmptyState title="Content unavailable" detail="This item is missing, private, blocked or hidden in your local privacy settings." action="Return" onAction={() => router.back()} /></Page>;
  return <Page><TopBar title={title} back /><LocalNote text="Reports are recorded only in this local demo. No moderation team is notified." />
    {submitted ? <View style={[styles.card, { padding: 16, gap: 9 }]}><Text style={styles.sectionHeading}>Report saved locally</Text><Text style={styles.body}>Your report has the mock status “Submitted”. It has not been sent to a moderator. You can review its local status below.</Text><Button title="Review moderation status" icon="time-outline" onPress={() => router.push("/moderation-status")} /><Button title="Done" variant="quiet" onPress={() => router.back()} /></View> : <>
      <Text style={styles.body}>Help keep Mabiz useful and safe. Select a reason and include only details needed to explain the concern.</Text><SectionTitle title="What is the concern?" /><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{REASONS.map((item) => <Chip key={item} label={item} selected={reason === item} onPress={() => setReason(item)} />)}</View><Field label="Additional context (optional)" value={details} onChangeText={setDetails} placeholder="What should a future reviewer know?" multiline /><Button title="Submit report" icon="flag-outline" disabled={!reason} onPress={submit} />
      <SectionTitle title="Other actions" /><Button title="Block this account" icon="person-remove-outline" variant="outline" onPress={() => { if (!app.isAuthenticated) return router.push("/auth/login"); setConfirmType("block"); }} />{kind === "post" || kind === "video" ? <Button title="Hide this content" icon="eye-off-outline" variant="outline" onPress={() => { if (!app.isAuthenticated) return router.push("/auth/login"); setConfirmType("hide"); }} /> : null}<Button title="Community guidelines" variant="quiet" onPress={() => router.push("/community-guidelines")} />
    </>}
    <ConfirmModal visible={Boolean(confirmType)} title={confirmType === "block" ? "Block this user?" : "Hide this content?"} detail={confirmType === "block" ? "This blocks the user in your local demo preferences only. No server account is affected." : "This hides the post from this device's local feed. You can manage moderation in settings."} confirmLabel={confirmType === "block" ? "Block user" : "Hide content"} destructive onCancel={() => setConfirmType(undefined)} onConfirm={confirmAction} />
  </Page>;
}
