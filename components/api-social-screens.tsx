import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Avatar, Button, Chip, EmptyState, Field, LoadingState, Page, SectionTitle, Stat, TopBar, styles } from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServices } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import type { ApiPollInput, FeedFilters, SocialApiComment } from "@/lib/api/feature-contracts";
import type { Business, Post, UserProfile } from "@/types/domain";

const LIMIT = 20;
const pageRequest = (cursor?: string) => ({ cursor, limit: LIMIT });
const errorText = (error: { message: string; code?: string }) => `${error.message}${error.code ? ` (${error.code})` : ""}`;

export function ApiHomeFeed() {
  const services = useBizConnectServices();
  const app = useAppStore();
  const [mode, setMode] = useState<"for-you" | "following">("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [quickMenu, setQuickMenu] = useState(false);
  const hasUnread = app.notifications.some((item) => !item.read);
  const load = useCallback(async (refresh = false, next = false) => {
    if (next && (!cursor || loadingMore)) return;
    if (refresh) setRefreshing(true); else if (next) setLoadingMore(true); else setLoading(true);
    setError("");
    const request: FeedFilters = { mode, limit: LIMIT, ...(next && cursor ? { cursor } : {}) };
    const result = await services.feed.list(request);
    if (!result.ok) setError(errorText(result.error));
    else {
      setPosts((current) => refresh || !next ? result.data.items : [...current, ...result.data.items]);
      setCursor(result.ok ? result.data.nextCursor : undefined);
    }
    setLoading(false); setRefreshing(false); setLoadingMore(false);
  }, [cursor, loadingMore, mode, services]);
  useEffect(() => { setPosts([]); setCursor(undefined); void load(false, false); }, [mode]);
  const onScroll = (event: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (contentSize.height - layoutMeasurement.height - contentOffset.y < 100 && cursor && !loadingMore) void load(false, true);
  };
  return <Page onRefresh={() => void load(true, false)} refreshing={refreshing} onScroll={onScroll}>
    <TopBar brandNameOnly right={<View style={styles.row}><Button title="Search" small variant="quiet" icon="search-outline" onPress={() => router.push("/search")} /><Pressable accessibilityRole="button" accessibilityLabel="Open your profile" onPress={() => router.push("/(tabs)/profile")}><Avatar name={app.user.name} image={app.user.avatar} size={34} /></Pressable></View>} />
    <View style={[styles.rowBetween, { paddingVertical: 2 }]}><SectionTitle title="Your feed" /><Pressable accessibilityRole="button" onPress={() => setQuickMenu((value) => !value)}><Ionicons name="ellipsis-horizontal" color={colors.muted} size={22} /></Pressable></View>
    {quickMenu ? <View style={[styles.row, { flexWrap: "wrap" }]}><Button title="Notifications" small variant="outline" onPress={() => router.push("/notifications")} /><Button title="Messages" small variant="outline" onPress={() => router.push("/messages")} /><Button title="Profile" small variant="outline" onPress={() => router.push("/(tabs)/profile")} /><Text style={styles.caption}>{hasUnread ? "You have unread notifications" : ""}</Text></View> : null}
    <View style={styles.row}><Chip label="For You" selected={mode === "for-you"} onPress={() => setMode("for-you")} /><Chip label="Following" selected={mode === "following"} onPress={() => setMode("following")} /></View>
    {error ? <View accessibilityRole="alert" style={{ gap: 8, padding: 12, backgroundColor: colors.orangeTint, borderRadius: 14 }}><Text style={styles.body}>Feed error: {error}</Text><Button title="Retry" small variant="outline" onPress={() => void load(true)} /></View> : null}
    {loading ? <LoadingState label="Loading feed from the server" /> : null}
    {!loading && !error && posts.length === 0 ? <EmptyState title={mode === "following" ? "No posts from people you follow" : "Your feed is empty"} detail={mode === "following" ? "Follow a person or business to see their posts here." : "New posts will appear here as they are published."} icon="albums-outline" action="Create a post" onAction={() => router.push("/(tabs)/create")} /> : null}
    {posts.map((post) => <ApiPostCard key={post.id} post={post} />)}
    {loadingMore ? <LoadingState label="Loading more posts" /> : null}
    {!loading && posts.length > 0 && !cursor && !loadingMore ? <Text style={[styles.caption, { textAlign: "center" }]}>You’re all caught up.</Text> : null}
  </Page>;
}

export function ApiPostComposer() {
  const services = useBizConnectServices();
  const app = useAppStore();
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState<"text" | "image" | "video" | "product" | "announcement">("text");
  const [identityKind, setIdentityKind] = useState<"personal" | "business">("personal");
  const [businessId, setBusinessId] = useState("");
  const [audience, setAudience] = useState<"public" | "followers" | "private">("public");
  const [allowComments, setAllowComments] = useState(true);
  const [location, setLocation] = useState("");
  const [urls, setUrls] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [altText, setAltText] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const validateUrl = (url: string) => {
    try { const parsed = new URL(url); return parsed.protocol === "https:" && !parsed.username && !parsed.password; } catch { return false; }
  };
  const publish = async () => {
    const cleanCaption = caption.trim();
    if (!cleanCaption) { setError("Write a caption before publishing. Text-only posts are supported."); return; }
    const mediaUrls = urls.split(/\n|,/).map((url) => url.trim()).filter(Boolean);
    if (mediaUrls.some((url) => !validateUrl(url))) { setError("Every media reference must be a hosted HTTPS URL. Local device files are not uploaded or accepted here."); return; }
    if (identityKind === "business" && !businessId.trim()) { setError("Enter the business ID to publish as a business identity."); return; }
    const options = pollOptions.map((item) => item.trim()).filter(Boolean);
    const wantsPoll = pollQuestion.trim().length > 0;
    if (wantsPoll && (options.length < 2 || options.length > 6)) { setError("A poll requires 2–6 non-empty options."); return; }
    const identityId = identityKind === "personal" ? app.user.id : businessId.trim();
    setBusy(true); setError("");
    const result = await services.posts.create({
      kind, caption: cleanCaption, identityKind, identityId, businessId: identityKind === "business" ? identityId : null,
      audience, allowComments, location: location.trim() || undefined,
      hashtags: [...new Set((cleanCaption.match(/#([\p{L}\p{N}_]+)/gu) ?? []).map((tag) => tag.slice(1)))],
      mediaReferences: mediaUrls.map((url) => ({ mediaType, url, ...(altText.trim() ? { altText: altText.trim() } : {}) })),
    });
    if (!result.ok) { setError(errorText(result.error)); setBusy(false); return; }
    if (wantsPoll) {
      const closesAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const pollInput: ApiPollInput = { question: pollQuestion.trim(), options, closesAt };
      const pollResult = await services.posts.createPoll(result.data.id, pollInput);
      if (!pollResult.ok) { setError(`Post was published, but poll creation failed: ${errorText(pollResult.error)}`); setBusy(false); router.replace({ pathname: "/post/[id]", params: { id: result.data.id } }); return; }
    }
    setBusy(false); router.replace("/(tabs)");
  };
  return <Page>
    <TopBar title="Create post" back />
    {!app.isAuthenticated ? <EmptyState title="Sign in to publish" detail="Publishing requires an authenticated API session." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /> : null}
    <View style={{ padding: 13, backgroundColor: colors.emeraldTint, borderRadius: 15 }}><Text style={styles.body}>Posts are sent to the API. Only hosted HTTPS media references are accepted; selecting a local photo or video here does not upload it.</Text></View>
    <Field label="Caption" value={caption} onChangeText={setCaption} multiline placeholder="Share a useful update…" />
    <Text style={styles.label}>Post type</Text><View style={[styles.row, { flexWrap: "wrap" }]}>{(["text", "image", "video", "product", "announcement"] as const).map((type) => <Chip key={type} label={type} selected={kind === type} onPress={() => setKind(type)} />)}</View>
    <Text style={styles.label}>Publish as</Text><View style={styles.row}><Chip label="Personal" selected={identityKind === "personal"} onPress={() => setIdentityKind("personal")} /><Chip label="Business" selected={identityKind === "business"} onPress={() => setIdentityKind("business")} /></View>
    {identityKind === "business" ? <Field label="Business ID" value={businessId} onChangeText={setBusinessId} placeholder="Business ID" autoCapitalize="none" /> : <Text style={styles.caption}>Publishing as {app.user.name} (@{app.user.username})</Text>}
    <Text style={styles.label}>Audience</Text><View style={[styles.row, { flexWrap: "wrap" }]}>{(["public", "followers", "private"] as const).map((item) => <Chip key={item} label={item} selected={audience === item} onPress={() => setAudience(item)} />)}</View>
    <Chip label={allowComments ? "Comments on" : "Comments off"} selected={allowComments} onPress={() => setAllowComments((value) => !value)} />
    <Field label="Location (optional)" value={location} onChangeText={setLocation} placeholder="Town or area" />
    <Text style={styles.sectionHeading}>Hosted media references (optional)</Text><View style={styles.row}><Chip label="Image URL" selected={mediaType === "image"} onPress={() => setMediaType("image")} /><Chip label="Video URL" selected={mediaType === "video"} onPress={() => setMediaType("video")} /></View>
    <Field label="HTTPS media URL(s)" value={urls} onChangeText={setUrls} multiline placeholder="https://cdn.example.com/path/to/media.jpg\nOne hosted URL per line" />
    <Field label="Alt text (optional)" value={altText} onChangeText={setAltText} placeholder="Describe the media" />
    <Text style={styles.sectionHeading}>Poll (optional)</Text><Field label="Question" value={pollQuestion} onChangeText={setPollQuestion} placeholder="Ask your audience" />
    {pollOptions.map((item, index) => <Field key={index} label={`Option ${index + 1}`} value={item} onChangeText={(value) => setPollOptions((items) => items.map((option, optionIndex) => optionIndex === index ? value : option))} placeholder={`Option ${index + 1}`} />)}
    <Button title="Add poll option" small variant="outline" disabled={pollOptions.length >= 6} onPress={() => setPollOptions((items) => [...items, ""])} />
    {error ? <Text accessibilityRole="alert" style={{ ...styles.body, color: colors.danger }}>Publish error: {error}</Text> : null}
    <Button title={busy ? "Publishing…" : "Publish"} icon="send-outline" disabled={busy || !app.isAuthenticated} onPress={() => void publish()} />
  </Page>;
}

export function ApiPostDetail({ postId }: { postId: string }) {
  const services = useBizConnectServices();
  const app = useAppStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<SocialApiComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<SocialApiComment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError(""); setCommentError("");
    const [postResult, commentsResult] = await Promise.all([services.posts.get(postId), services.posts.listComments(postId, pageRequest())]);
    if (!postResult.ok) setError(errorText(postResult.error)); else setPost(postResult.data);
    if (!commentsResult.ok) setCommentError(errorText(commentsResult.error)); else setComments(commentsResult.data.items);
    setLoading(false);
  }, [postId, services]);
  useEffect(() => { void load(); }, [load]);
  const send = async () => {
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    const text = commentText.trim(); if (!text) return;
    setBusy(true); setCommentError("");
    const result = replyTo ? await services.posts.reply(postId, replyTo.id, { text }) : await services.posts.comment(postId, { text });
    if (!result.ok) setCommentError(errorText(result.error)); else { setCommentText(""); setReplyTo(null); await load(); }
    setBusy(false);
  };
  return <Page onRefresh={() => void load()} refreshing={loading}>
    <TopBar title="Post" back />
    {error ? <View accessibilityRole="alert" style={{ gap: 8 }}><Text style={styles.body}>Post error: {error}</Text><Button title="Retry" small variant="outline" onPress={() => void load()} /></View> : null}
    {loading ? <LoadingState label="Loading post and comments" /> : null}
    {!loading && !error && post ? <>
      <ApiPostCard post={post} />
      <SectionTitle title={`Comments · ${post.commentCount ?? comments.length}`} />
      {commentError ? <Text accessibilityRole="alert" style={{ ...styles.body, color: colors.danger }}>Comments error: {commentError}</Text> : null}
      {comments.map((comment) => <View key={comment.id} style={{ gap: 8 }}><View style={styles.actionTile}><Avatar name={comment.userName} image={comment.userAvatar} size={34} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{comment.userName}</Text><Text style={styles.body}>{comment.text}</Text></View><Button title="Reply" small variant="quiet" onPress={() => { setReplyTo(comment); setCommentText(""); }} /></View>
        {comment.replyCount ? <Replies comment={comment} /> : null}
      </View>)}
      {comments.length === 0 && !commentError ? <EmptyState title="No comments yet" detail="Start the conversation." icon="chatbubbles-outline" /> : null}
      {post.allowComments === false ? <Text style={styles.caption}>Comments are disabled for this post.</Text> : <>
        {replyTo ? <View style={styles.rowBetween}><Text style={styles.caption}>Replying to {replyTo.userName}</Text><Button title="Cancel reply" small variant="quiet" onPress={() => { setReplyTo(null); setCommentText(""); }} /></View> : null}
        <Field label={replyTo ? "Write a reply" : "Add a comment"} value={commentText} onChangeText={setCommentText} multiline placeholder="Share a helpful thought…" />
        <Button title={busy ? "Sending…" : replyTo ? "Send reply" : "Comment"} icon="send-outline" disabled={busy || !app.isAuthenticated} onPress={() => void send()} />
      </>}
    </> : null}
  </Page>;
}

function Replies({ comment }: { comment: SocialApiComment }) {
  const services = useBizConnectServices();
  const [replies, setReplies] = useState<SocialApiComment[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { let mounted = true; services.posts.listReplies(comment.id, pageRequest()).then((result) => { if (!mounted) return; if (!result.ok) setError(errorText(result.error)); else setReplies(result.data.items); }); return () => { mounted = false; }; }, [comment.id, services]);
  return <View style={{ marginLeft: 34, gap: 6 }}>{error ? <Text accessibilityRole="alert" style={styles.caption}>Replies unavailable: {error}</Text> : replies.map((reply) => <View key={reply.id} style={styles.actionTile}><Avatar name={reply.userName} image={reply.userAvatar} size={28} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{reply.userName}</Text><Text style={styles.body}>{reply.text}</Text></View></View>)}</View>;
}

export function ApiPersonProfile({ personId }: { personId: string }) {
  const services = useBizConnectServices();
  const app = useAppStore();
  const [person, setPerson] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const isSelf = personId === app.user.id || personId === "me";
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const profileId = isSelf ? "me" : personId;
    const [profileResult, postsResult, followResult] = await Promise.all([
      services.users.getProfile(profileId), services.posts.listUserPosts(profileId, pageRequest()),
      isSelf ? Promise.resolve(null) : services.users.getFollowStatus(personId),
    ]);
    if (!profileResult.ok) setError(errorText(profileResult.error)); else setPerson(profileResult.data);
    if (!postsResult.ok) setError((current) => current ? `${current}; posts: ${errorText(postsResult.error)}` : `Posts: ${errorText(postsResult.error)}`); else setPosts(postsResult.data.items);
    if (followResult) { if (!followResult.ok) setActionError(errorText(followResult.error)); else { setFollowing(followResult.data.following); setFollowerCount(followResult.data.followerCount); } }
    setLoading(false);
  }, [isSelf, personId, services]);
  useEffect(() => { void load(); }, [load]);
  const toggleFollow = async () => {
    setBusy(true); setActionError("");
    const result = following ? await services.users.unfollow(personId) : await services.users.follow(personId);
    if (!result.ok) setActionError(errorText(result.error)); else {
      const status = await services.users.getFollowStatus(personId);
      if (!status.ok) setActionError(errorText(status.error)); else { setFollowing(status.data.following); setFollowerCount(status.data.followerCount); }
    }
    setBusy(false);
  };
  return <Page onRefresh={() => void load()} refreshing={loading}>
    <TopBar title="Founder profile" back />
    {error ? <View accessibilityRole="alert"><Text style={styles.body}>Profile error: {error}</Text><Button title="Retry" small variant="outline" onPress={() => void load()} /></View> : null}
    {loading ? <LoadingState label="Loading profile from server" /> : null}
    {!loading && !error && person ? <>
      <View style={{ alignItems: "center", gap: 8, padding: 16, backgroundColor: colors.surface, borderRadius: 20 }}><Avatar name={person.name} image={person.avatar} size={82} ring /><Text style={styles.sectionHeading}>{person.name}</Text><Text style={styles.caption}>@{person.username} · {person.town}, {person.county}</Text><Text style={[styles.body, { textAlign: "center" }]}>{person.bio}</Text>
        <View style={styles.row}><Stat value={followerCount ?? person.followers} label="Followers" /><Stat value={person.following} label="Following" /><Stat value={posts.length} label="Posts" /></View>
        {!isSelf ? <Button title={busy ? "Working…" : following ? "Following · unfollow" : "Follow"} icon={following ? "checkmark" : "person-add-outline"} variant={following ? "soft" : "primary"} disabled={busy || !app.isAuthenticated} onPress={() => void toggleFollow()} /> : null}
        {actionError ? <Text accessibilityRole="alert" style={{ ...styles.caption, color: colors.danger }}>Follow error: {actionError}</Text> : null}
        <Button title="Followers & following" variant="outline" onPress={() => router.push("/followers")} />
      </View>
      <SectionTitle title="Posts" />
      {posts.length ? posts.map((post) => <ApiPostCard key={post.id} post={post} />) : <EmptyState title="No posts" detail="This profile has not published posts visible to you." icon="albums-outline" />}
    </> : null}
  </Page>;
}

export function ApiBusinessProfile({ businessId }: { businessId: string }) {
  const services = useBizConnectServices();
  const app = useAppStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [businessResult, postsResult, followResult] = await Promise.all([services.businesses.get(businessId), services.posts.listBusinessPosts(businessId, pageRequest()), services.businesses.getFollowStatus(businessId)]);
    if (!businessResult.ok) setError(errorText(businessResult.error)); else setBusiness(businessResult.data);
    if (!postsResult.ok) setError((current) => current ? `${current}; posts: ${errorText(postsResult.error)}` : `Posts: ${errorText(postsResult.error)}`); else setPosts(postsResult.data.items);
    if (!followResult.ok) setActionError(errorText(followResult.error)); else { setFollowing(followResult.data.following); setFollowerCount(followResult.data.followerCount); }
    setLoading(false);
  }, [businessId, services]);
  useEffect(() => { void load(); }, [load]);
  const toggleFollow = async () => {
    setBusy(true); setActionError("");
    const result = following ? await services.businesses.unfollow(businessId) : await services.businesses.follow(businessId);
    if (!result.ok) setActionError(errorText(result.error)); else {
      const status = await services.businesses.getFollowStatus(businessId);
      if (!status.ok) setActionError(errorText(status.error)); else { setFollowing(status.data.following); setFollowerCount(status.data.followerCount); }
    }
    setBusy(false);
  };
  const startEnquiry = async () => {
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    setBusy(true); setActionError("");
    const result = await services.messaging.startConversation({ businessId, firstMessage: "Hello, I would like to learn more about your business." });
    if (!result.ok) setActionError(errorText(result.error)); else router.push({ pathname: "/messages/[id]", params: { id: result.data.id } });
    setBusy(false);
  };
  return <Page onRefresh={() => void load()} refreshing={loading}>
    <TopBar title="Business profile" back />
    {error ? <View accessibilityRole="alert"><Text style={styles.body}>Business profile error: {error}</Text><Button title="Retry" small variant="outline" onPress={() => void load()} /></View> : null}
    {loading ? <LoadingState label="Loading business profile" /> : null}
    {!loading && !error && business ? <>
      <View style={{ padding: 17, borderRadius: 20, backgroundColor: colors.surface, gap: 9, alignItems: "center" }}><Avatar name={business.name} image={business.logo} size={78} ring /><Text style={styles.sectionHeading}>{business.name}</Text><Text style={styles.caption}>{business.category} · {business.town}, {business.county}</Text><Text style={styles.body}>{business.description}</Text><Stat value={followerCount ?? business.followers} label="Followers" />
        <Button title={busy ? "Working…" : following ? "Following · unfollow" : "Follow business"} icon={following ? "checkmark" : "add-outline"} variant={following ? "soft" : "primary"} disabled={busy || !app.isAuthenticated} onPress={() => void toggleFollow()} />
        <Button title="Message business" icon="chatbubble-outline" variant="outline" disabled={busy} onPress={() => void startEnquiry()} />
        {actionError ? <Text accessibilityRole="alert" style={{ ...styles.caption, color: colors.danger }}>Follow error: {actionError}</Text> : null}
        <Button title="View followers" variant="outline" onPress={() => router.push({ pathname: "/followers", params: { businessId } })} />
      </View>
      <SectionTitle title={`Posts · ${posts.length}`} />
      {posts.length ? posts.map((post) => <ApiPostCard key={post.id} post={post} />) : <EmptyState title="No posts yet" detail="Business posts that are visible to you will appear here." icon="albums-outline" />}
    </> : null}
  </Page>;
}

export function ApiFollowersScreen({ selectedBusinessId }: { selectedBusinessId?: string }) {
  const services = useBizConnectServices();
  const app = useAppStore();
  const [list, setList] = useState<"Followers" | "Following">("Following");
  const [mode, setMode] = useState<"People" | "Businesses">("People");
  const [businessId, setBusinessId] = useState(selectedBusinessId ?? "");
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    if (mode === "Businesses" && list === "Following") { setPeople([]); setLoading(false); return; }
    if (mode === "Businesses" && !businessId.trim()) { setPeople([]); setError("Select or enter a business ID to view its followers."); setLoading(false); return; }
    const result = mode === "People"
      ? list === "Followers" ? await services.users.listFollowers("me", pageRequest()) : await services.users.listFollowing("me", pageRequest())
      : await services.businesses.listFollowers(businessId.trim(), pageRequest());
    if (!result.ok) setError(errorText(result.error)); else setPeople(result.data.items);
    setLoading(false);
  }, [businessId, list, mode, services]);
  useEffect(() => { void load(); }, [load]);
  return <Page onRefresh={() => void load()} refreshing={loading}>
    <TopBar title="Followers & following" back />
    {!app.isAuthenticated ? <EmptyState title="Sign in to view social lists" detail="These lists require an authenticated API session." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /> : <>
      <View style={styles.row}><Chip label="Followers" selected={list === "Followers"} onPress={() => setList("Followers")} /><Chip label="Following" selected={list === "Following"} onPress={() => setList("Following")} /></View>
      <View style={styles.row}><Chip label="People" selected={mode === "People"} onPress={() => setMode("People")} /><Chip label="Businesses" selected={mode === "Businesses"} onPress={() => setMode("Businesses")} /></View>
      {mode === "Businesses" ? <Field label="Business ID (required for business followers)" value={businessId} onChangeText={setBusinessId} placeholder="Business ID" autoCapitalize="none" /> : null}
      {mode === "Businesses" && list === "Following" ? <Text style={styles.caption}>The API does not provide a business-following list route yet.</Text> : null}
      {error ? <View accessibilityRole="alert"><Text style={{ ...styles.body, color: colors.danger }}>List error: {error}</Text><Button title="Retry" small variant="outline" onPress={() => void load()} /></View> : null}
      {loading ? <LoadingState label="Loading list from server" /> : null}
      {!loading && !error && !people.length && !(mode === "Businesses" && list === "Following") ? <EmptyState title={list === "Followers" ? "No followers yet" : "Not following anyone yet"} detail="This list is returned by the server." icon="people-outline" /> : null}
      {people.map((person) => <Pressable key={person.id} onPress={() => router.push({ pathname: "/person/[id]", params: { id: person.id } })} style={styles.actionTile}><Avatar name={person.name} image={person.avatar} size={42} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{person.name}</Text><Text style={styles.caption}>@{person.username} · {person.town}</Text></View></Pressable>)}
    </>}
  </Page>;
}

export function ApiPersonalProfile() {
  const services = useBizConnectServices();
  const app = useAppStore();
  const [person, setPerson] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [profile, page] = await Promise.all([services.users.getProfile("me"), services.posts.listUserPosts("me", pageRequest())]);
    if (!profile.ok) setError(errorText(profile.error)); else setPerson(profile.data);
    if (!page.ok) setError((current) => current ? `${current}; posts: ${errorText(page.error)}` : `Posts: ${errorText(page.error)}`); else setPosts(page.data.items);
    setLoading(false);
  }, [services]);
  useEffect(() => { void load(); }, [load]);
  return <Page onRefresh={() => void load()} refreshing={loading}>
    <TopBar title="Profile" />
    {error ? <View accessibilityRole="alert"><Text style={styles.body}>Profile error: {error}</Text><Button title="Retry" small variant="outline" onPress={() => void load()} /></View> : null}
    {loading ? <LoadingState label="Loading your profile from server" /> : null}
    {!loading && !error && person ? <>
      <View style={{ alignItems: "center", gap: 10, paddingTop: 4, paddingBottom: 8 }}>
        <View style={{ alignSelf: "stretch", alignItems: "flex-end" }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push("/settings")} hitSlop={8} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="settings-outline" size={21} color={colors.navy} />
          </Pressable>
        </View>
        <Avatar name={person.name} image={person.avatar} size={112} ring />
        <Text style={{ color: colors.navy, fontSize: 28, fontWeight: "800", textAlign: "center" }}>{person.name}</Text>
        <Text style={{ color: colors.muted, fontSize: 14 }}>@{person.username}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="location-outline" size={15} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 13 }}>{person.town}, {person.county}</Text>
        </View>
        {person.bio ? <Text style={[styles.body, { textAlign: "center", paddingHorizontal: 24 }]}>{person.bio}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Followers and following" onPress={() => router.push("/followers")} style={{ flexDirection: "row", gap: 22, paddingVertical: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 14 }}><Text style={{ color: colors.navy, fontWeight: "800" }}>{person.followers}</Text> followers</Text>
          <Text style={{ color: colors.muted, fontSize: 14 }}><Text style={{ color: colors.navy, fontWeight: "800" }}>{person.following}</Text> following</Text>
          <Text style={{ color: colors.muted, fontSize: 14 }}><Text style={{ color: colors.navy, fontWeight: "800" }}>{posts.length}</Text> posts</Text>
        </Pressable>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => router.push("/edit-profile")} style={{ height: 46, paddingHorizontal: 26, borderRadius: 23, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.white, fontSize: 14, fontWeight: "800" }}>Edit profile</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Followers and following" onPress={() => router.push("/followers")} style={{ height: 46, paddingHorizontal: 26, borderRadius: 23, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "800" }}>People</Text>
          </Pressable>
        </View>
      </View>
      <SectionTitle title="Posts" />{posts.length ? posts.map((post) => <ApiPostCard key={post.id} post={post} />) : <EmptyState title="No posts yet" detail="Your published posts will appear here." icon="albums-outline" />}
    </> : null}
    <Text style={styles.caption}>Signed in as {app.user.username} · profile and post visibility are determined by server responses.</Text>
  </Page>;
}
