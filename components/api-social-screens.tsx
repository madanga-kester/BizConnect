import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Share, Switch, Text, TextInput, View, useWindowDimensions } from "react-native";
import {
  ActionTile,
  Avatar,
  Button,
  Chip,
  EmptyState,
  Field,
  LoadingState,
  Page,
  SectionTitle,
  Stat,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { useAppStore } from "@/hooks/use-app-store";
import { pickFromGallery, type PickedMedia } from "@/hooks/use-media-picker";
import { useMabizServices } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import type { ApiPollInput, FeedFilters, SocialApiComment } from "@/lib/api/feature-contracts";
import type { Business, Post, UserProfile } from "@/types/domain";

const LIMIT = 20;
const pageRequest = (cursor?: string) => ({ cursor, limit: LIMIT });
const errorText = (error: { message: string; code?: string }) =>
  `${error.message}${error.code ? ` (${error.code})` : ""}`;

export function ApiHomeFeed() {
  const services = useMabizServices();
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
  const load = useCallback(
    async (refresh = false, next = false) => {
      if (next && (!cursor || loadingMore)) return;
      if (refresh) setRefreshing(true);
      else if (next) setLoadingMore(true);
      else setLoading(true);
      setError("");
      const request: FeedFilters = { mode, limit: LIMIT, ...(next && cursor ? { cursor } : {}) };
      const result = await services.feed.list(request);
      if (!result.ok) setError(errorText(result.error));
      else {
        setPosts((current) => (refresh || !next ? result.data.items : [...current, ...result.data.items]));
        setCursor(result.ok ? result.data.nextCursor : undefined);
      }
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    },
    [cursor, loadingMore, mode, services]
  );
  useEffect(() => {
    setPosts([]);
    setCursor(undefined);
    void load(false, false);
  }, [mode]);
  const onScroll = (event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (contentSize.height - layoutMeasurement.height - contentOffset.y < 100 && cursor && !loadingMore)
      void load(false, true);
  };
  return (
    <Page onRefresh={() => void load(true, false)} refreshing={refreshing} onScroll={onScroll}>
      <TopBar
        brandNameOnly
        right={
          <View style={styles.row}>
            <Button title="Search" small variant="quiet" icon="search-outline" onPress={() => router.push("/search")} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Avatar name={app.user.name} image={app.user.avatar} size={34} />
            </Pressable>
          </View>
        }
      />
      <View style={[styles.rowBetween, { paddingVertical: 2 }]}>
        <SectionTitle title="Your feed" />
        <Pressable accessibilityRole="button" onPress={() => setQuickMenu((value) => !value)}>
          <Ionicons name="ellipsis-horizontal" color={colors.muted} size={22} />
        </Pressable>
      </View>
      {quickMenu ? (
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button title="Notifications" small variant="outline" onPress={() => router.push("/menu/activity/notifications")} />
          <Button title="Messages" small variant="outline" onPress={() => router.push("/messages")} />
          <Button title="Profile" small variant="outline" onPress={() => router.push("/(tabs)/profile")} />
          <Text style={styles.caption}>{hasUnread ? "You have unread notifications" : ""}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <Chip label="For You" selected={mode === "for-you"} onPress={() => setMode("for-you")} />
        <Chip label="Following" selected={mode === "following"} onPress={() => setMode("following")} />
      </View>
      {error ? (
        <View accessibilityRole="alert" style={{ gap: 8, padding: 12, backgroundColor: colors.orangeTint, borderRadius: 14 }}>
          <Text style={styles.body}>Feed error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load(true)} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading feed from the server" /> : null}
      {!loading && !error && posts.length === 0 ? (
        <EmptyState
          title={mode === "following" ? "No posts from people you follow" : "Your feed is empty"}
          detail={
            mode === "following"
              ? "Follow a person or business to see their posts here."
              : "New posts will appear here as they are published."
          }
          icon="albums-outline"
          action="Create a post"
          onAction={() => router.push("/(tabs)/create")}
        />
      ) : null}
      {posts.map((post) => (
        <ApiPostCard key={post.id} post={post} />
      ))}
      {loadingMore ? <LoadingState label="Loading more posts" /> : null}
      {!loading && posts.length > 0 && !cursor && !loadingMore ? (
        <Text style={[styles.caption, { textAlign: "center" }]}>You’re all caught up.</Text>
      ) : null}
    </Page>
  );
}

export function ApiPostComposer() {
  const services = useMabizServices();
  const app = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState<"text" | "product" | "announcement">("text");
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
  const [showPoll, setShowPoll] = useState(false);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
    const [showIdentityPicker, setShowIdentityPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<PickedMedia[]>([]);
  const [busyLabel, setBusyLabel] = useState("");
  const uploadedUrls = useRef<Record<string, string>>({});

  const ownedBusinesses = app.businesses.filter(
    (b) => b.ownerId === app.user.id || b.team.some((m) => m.userId === app.user.id)
  );
  const activeBusiness = ownedBusinesses.find((b) => b.id === businessId);

  const validateUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  };

  const openGallery = async (type: "image" | "video") => {
    const maxItems = 10;
    const keepCurrent = type === "image" && picked.length > 0 && picked[0].mediaType === "image";
    const remaining = type === "image" ? maxItems - (keepCurrent ? picked.length : 0) : 1;
    if (remaining < 1) {
      setError("You can attach up to 10 photos to one post.");
      return;
    }
    setError("");
    const result = await pickFromGallery(type, remaining);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.items.length === 0) return;
    setPicked((current) => (keepCurrent ? [...current, ...result.items].slice(0, maxItems) : result.items));
  };

  const toggleIdentity = () => {
    if (identityKind === "personal") {
      setIdentityKind("business");
      if (!businessId && ownedBusinesses[0]) setBusinessId(ownedBusinesses[0].id);
    } else {
      setIdentityKind("personal");
    }
  };

  const getPublishCaption = () => {
    if (showPoll) return caption.trim();
    if (kind === "product") {
      return [
        `Product: ${productName.trim()}`,
        productPrice.trim() ? `Price: ${productPrice.trim()}` : "",
        productUrl.trim() ? `Product link: ${productUrl.trim()}` : "",
        caption.trim(),
      ].filter(Boolean).join("\n\n");
    }
    if (kind === "announcement") {
      return [announcementTitle.trim(), caption.trim()].filter(Boolean).join("\n\n");
    }
    return caption.trim();
  };

  const continueToPreview = () => {
    setError("");
    if (identityKind === "business" && !businessId.trim()) {
      setError("Select the business that will publish this post.");
      return;
    }
    if (showPoll) {
      const options = pollOptions.map((item) => item.trim()).filter(Boolean);
      if (!pollQuestion.trim()) return setError("Add a question for your poll.");
      if (options.length < 2 || options.length > 6) return setError("A poll needs 2–6 non-empty options.");
    } else if (kind === "product") {
      if (!productName.trim()) return setError("Add the product name before continuing.");
      if (productUrl.trim() && !validateUrl(productUrl.trim())) return setError("The product link must be a valid HTTPS URL.");
    } else if (kind === "announcement" && !announcementTitle.trim()) {
      return setError("Add a title for your business update.");
    } else if (!caption.trim() && picked.length === 0 && !urls.trim()) {
      return setError("Write something or attach a photo or video before continuing.");
    }
    const mediaUrls = urls.split(/\n|,/).map((url) => url.trim()).filter(Boolean);
    if (mediaUrls.some((url) => !validateUrl(url))) return setError("Every media reference must be a hosted HTTPS URL.");
    setStep(3);
  };

  const publish = async () => {
    const cleanCaption = getPublishCaption();
    if (!cleanCaption && !(showPoll && pollQuestion.trim())) {
      setError("Add content before publishing.");
      return;
    }
    const mediaUrls = urls.split(/\n|,/).map((url) => url.trim()).filter(Boolean);
    if (mediaUrls.some((url) => !validateUrl(url))) {
      setError("Every media reference must be a hosted HTTPS URL.");
      return;
    }
    if (identityKind === "business" && !businessId.trim()) {
      setError("Select the business that will publish this post.");
      return;
    }
    const options = pollOptions.map((item) => item.trim()).filter(Boolean);
    const wantsPoll = showPoll;
    if (wantsPoll && (!pollQuestion.trim() || options.length < 2 || options.length > 6)) {
      setError("A poll needs a question and 2–6 non-empty options.");
      return;
    }
    const identityId = identityKind === "personal" ? app.user.id : businessId.trim();
    setBusy(true);
    setError("");
    const alt = altText.trim() ? { altText: altText.trim() } : {};
    const stopWith = (message: string) => {
      setError(message);
      setBusy(false);
      setBusyLabel("");
    };
    const uploadedMedia: { mediaType: "image" | "video"; url: string; altText?: string }[] = [];
    for (let index = 0; index < picked.length; index += 1) {
      const item = picked[index];
      const label = `Uploading ${index + 1} of ${picked.length}`;
      let url = uploadedUrls.current[item.uri];
      if (!url) {
        setBusyLabel(label);
        const file = { uri: item.uri, fileName: item.fileName, contentType: item.contentType, sizeBytes: item.sizeBytes };
        const ticket = await services.media.begin({ fileName: file.fileName, contentType: file.contentType, sizeBytes: file.sizeBytes });
        if (!ticket.ok) return stopWith(`Upload failed: ${errorText(ticket.error)}`);
        const sent = await services.media.upload(ticket.data, file, (progress) => setBusyLabel(`${label} (${progress.percent}%)`));
        if (!sent.ok) return stopWith(`Upload failed: ${errorText(sent.error)}`);
        const completed = await services.media.complete(ticket.data);
        if (!completed.ok) return stopWith(`Upload failed: ${errorText(completed.error)}`);
        if (!validateUrl(completed.data.url)) return stopWith("The server returned a media address that cannot be attached to a post.");
        url = completed.data.url;
        uploadedUrls.current[item.uri] = url;
      }
      uploadedMedia.push({ mediaType: item.mediaType, url, ...alt });
    }
    setBusyLabel("");
    const allMedia = [...uploadedMedia, ...mediaUrls.map((url) => ({ mediaType, url, ...alt }))];
    const finalKind = showPoll || kind === "text" ? (allMedia.length > 0 ? allMedia[0].mediaType : "text") : kind;
    const result = await services.posts.create({
      kind: finalKind,
      caption: cleanCaption,
      identityKind,
      identityId,
      businessId: identityKind === "business" ? identityId : null,
      audience,
      allowComments,
      location: location.trim() || undefined,
      hashtags: [...new Set((cleanCaption.match(/#([\p{L}\p{N}_]+)/gu) ?? []).map((tag) => tag.slice(1)))],
      mediaReferences: allMedia,
    });
    if (!result.ok) {
      setError(errorText(result.error));
      setBusy(false);
      return;
    }
    if (wantsPoll) {
      const closesAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const pollInput: ApiPollInput = { question: pollQuestion.trim(), options, closesAt };
      const pollResult = await services.posts.createPoll(result.data.id, pollInput);
      if (!pollResult.ok) {
        setError(`Post published, but poll creation failed: ${errorText(pollResult.error)}`);
        setBusy(false);
        router.replace({ pathname: "/post/[id]", params: { id: result.data.id } });
        return;
      }
    }
    setBusy(false);
    router.replace("/(tabs)");
  };

  const pickedStrip = picked.length > 0 ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {picked.map((item, index) => (
        <View key={`${item.uri}-${index}`}>
          {item.mediaType === "image" ? (
            <Image source={{ uri: item.uri }} style={{ width: 96, height: 96, borderRadius: 12 }} />
          ) : (
            <View style={{ width: 96, height: 96, borderRadius: 12, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="videocam" size={28} color={colors.white} />
            </View>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="Remove media" disabled={busy}
            onPress={() => setPicked((current) => current.filter((_, position) => position !== index))}
            style={{ position: "absolute", right: 4, top: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="close" size={13} color={colors.white} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  ) : null;

  const typeChoices = [
    { title: "Post", detail: "Share an update, photo, video or thought.", icon: "create-outline" as const, select: () => { setKind("text"); setShowPoll(false); } },
    { title: "Poll", detail: "Ask a question and collect votes.", icon: "stats-chart-outline" as const, select: () => { setKind("text"); setShowPoll(true); } },
    { title: "Product", detail: "Showcase a product with its name, price and link.", icon: "pricetag-outline" as const, select: () => { setKind("product"); setShowPoll(false); setIdentityKind("business"); if (!businessId && ownedBusinesses[0]) setBusinessId(ownedBusinesses[0].id); } },
    { title: "Business update", detail: "Share news or an announcement from your business.", icon: "business-outline" as const, select: () => { setKind("announcement"); setShowPoll(false); setIdentityKind("business"); if (!businessId && ownedBusinesses[0]) setBusinessId(ownedBusinesses[0].id); } },
  ];
  const selectedType = showPoll ? "Poll" : kind === "product" ? "Product" : kind === "announcement" ? "Business update" : "Post";

  return (
    <Page>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
        <Pressable onPress={() => { if (step === 3) setStep(2); else if (step === 2) setStep(1); else router.back(); }} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
        <Text style={{ color: colors.navy, fontSize: 17, fontWeight: "800" }}>{step === 1 ? "Create something" : step === 2 ? `Create ${selectedType.toLowerCase()}` : "Preview post"}</Text>
        <Pressable onPress={() => router.push("/menu/activity/drafts")}><Text style={{ color: colors.emeraldDark, fontSize: 14, fontWeight: "700" }}>Drafts</Text></Pressable>
      </View>

      {!app.isAuthenticated ? <EmptyState title="Sign in to publish" detail="Publishing requires an authenticated API session." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /> : null}
      {error ? <Text accessibilityRole="alert" style={{ ...styles.body, color: colors.danger }}>{error}</Text> : null}

      {step === 1 ? (
        <View style={{ gap: 12, paddingTop: 8 }}>
          <Text style={{ color: colors.navy, fontSize: 21, fontWeight: "800" }}>What would you like to create?</Text>
          <Text style={styles.caption}>Choose a format. We’ll tailor the next screen to what you’re sharing.</Text>
          {typeChoices.map((choice) => {
            const active = selectedType === choice.title;
            return (
              <Pressable key={choice.title} onPress={() => { choice.select(); setError(""); setStep(2); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: active ? colors.emerald : colors.border, backgroundColor: active ? colors.subtle : colors.surface }}>
                <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: active ? colors.emerald : colors.subtle, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={choice.icon} size={22} color={active ? colors.white : colors.navy} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: colors.navy, fontSize: 15, fontWeight: "800" }}>{choice.title}</Text>
                  <Text style={styles.caption}>{choice.detail}</Text>
                </View>
                <Ionicons name="chevron-forward" size={19} color={colors.muted} />
              </Pressable>
            );
          })}
          {ownedBusinesses.length === 0 ? <Text style={styles.caption}>Product and business update posts require a business profile.</Text> : null}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: 14, paddingTop: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ gap: 3 }}><Text style={{ color: colors.navy, fontSize: 19, fontWeight: "800" }}>{selectedType}</Text><Text style={styles.caption}>Build your post below.</Text></View>
            <Button title="Change type" small variant="quiet" onPress={() => setStep(1)} />
          </View>

          <Pressable onPress={toggleIdentity} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Avatar name={identityKind === "business" ? activeBusiness?.name ?? "Business" : app.user.name} image={identityKind === "business" ? activeBusiness?.logo : app.user.avatar} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.navy, fontSize: 15, fontWeight: "800" }}>{identityKind === "business" ? activeBusiness?.name ?? "Business profile" : app.user.name}</Text>
              <Text style={styles.caption}>{identityKind === "business" ? "Posting as business · Tap to change" : "Posting to your profile · Tap to change"}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.muted} />
          </Pressable>
          {identityKind === "business" ? (
            <View style={{ gap: 6 }}>
              {ownedBusinesses.length > 0 ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{ownedBusinesses.map((b) => <Chip key={b.id} label={b.name} selected={businessId === b.id} onPress={() => setBusinessId(b.id)} />)}</View> : null}
              {ownedBusinesses.length === 0 ? <Field label="Business ID" value={businessId} onChangeText={setBusinessId} placeholder="Enter business ID" autoCapitalize="none" /> : null}
            </View>
          ) : null}

          {showPoll ? (
            <View style={{ gap: 10, padding: 14, borderRadius: 16, backgroundColor: colors.subtle }}>
              <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "800" }}>Your poll question</Text>
              <Field label="Question" value={pollQuestion} onChangeText={setPollQuestion} placeholder="What do you want to ask?" />
              {pollOptions.map((item, index) => <View key={index} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><View style={{ flex: 1 }}><Field label={`Option ${index + 1}`} value={item} onChangeText={(value) => setPollOptions((items) => items.map((opt, idx) => idx === index ? value : opt))} placeholder={`Choice ${index + 1}`} /></View>{pollOptions.length > 2 ? <Pressable onPress={() => setPollOptions((items) => items.filter((_, idx) => idx !== index))}><Ionicons name="close-circle" size={22} color={colors.muted} /></Pressable> : null}</View>)}
              <Button title="Add another option" small variant="outline" disabled={pollOptions.length >= 6} onPress={() => setPollOptions((items) => [...items, ""])} />
              <Field label="Add context (optional)" value={caption} onChangeText={setCaption} multiline placeholder="Add a little context for your audience…" />
            </View>
          ) : kind === "product" ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "800" }}>Product information</Text>
              <Field label="Product name" value={productName} onChangeText={setProductName} placeholder="e.g. Handmade leather bag" />
              <Field label="Price (optional)" value={productPrice} onChangeText={setProductPrice} placeholder="e.g. KSh 3,500" />
              <Field label="Product link (optional)" value={productUrl} onChangeText={setProductUrl} placeholder="https://yourstore.com/product" autoCapitalize="none" />
              <Field label="Description" value={caption} onChangeText={setCaption} multiline placeholder="Describe the product, its features and how to order…" />
            </View>
          ) : kind === "announcement" ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "800" }}>Business announcement</Text>
              <Field label="Headline" value={announcementTitle} onChangeText={setAnnouncementTitle} placeholder="What’s the update?" />
              <Field label="Details" value={caption} onChangeText={setCaption} multiline placeholder="Share the news, dates, details or next steps…" />
            </View>
          ) : (
            <TextInput style={{ color: colors.navy, fontSize: 16, minHeight: 150, textAlignVertical: "top", paddingTop: 4 }} placeholder="What would you like to share?" placeholderTextColor={colors.muted} multiline maxLength={1000} value={caption} onChangeText={setCaption} />
          )}

          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "800" }}>Add photos or video</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}><Button title="Photo" small icon="image-outline" variant="outline" disabled={busy} onPress={() => void openGallery("image")} /></View>
              <View style={{ flex: 1 }}><Button title="Video" small icon="videocam-outline" variant="outline" disabled={busy} onPress={() => void openGallery("video")} /></View>
            </View>
            {pickedStrip}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Text style={styles.caption}>Or add hosted media</Text><View style={styles.row}><Chip label="Image" selected={mediaType === "image"} onPress={() => setMediaType("image")} /><Chip label="Video" selected={mediaType === "video"} onPress={() => setMediaType("video")} /></View></View>
            <Field label="HTTPS media URL(s) (optional)" value={urls} onChangeText={setUrls} multiline placeholder="https://cdn.example.com/photo.jpg" />
            {(picked.length > 0 || urls.trim()) ? <Field label="Alt text (optional)" value={altText} onChangeText={setAltText} placeholder="Describe the attached media" /> : null}
          </View>

          <Field label="Location (optional)" value={location} onChangeText={setLocation} placeholder="Town or area" />
          <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.subtle, gap: 12 }}>
            <View style={styles.rowBetween}><View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Ionicons name="globe-outline" size={19} color={colors.navy} /><Text style={styles.body}>Who can see this?</Text></View><Pressable onPress={() => setAudience((value) => value === "public" ? "followers" : value === "followers" ? "private" : "public")}><Text style={{ color: colors.emeraldDark, fontWeight: "700", textTransform: "capitalize" }}>{audience}  <Ionicons name="chevron-down" size={12} /></Text></Pressable></View>
            <View style={styles.rowBetween}><View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Ionicons name="chatbubble-outline" size={19} color={colors.navy} /><Text style={styles.body}>Allow comments</Text></View><Switch value={allowComments} onValueChange={setAllowComments} trackColor={{ false: colors.border, true: colors.emerald }} thumbColor={colors.white} /></View>
          </View>
          <Button title="Preview post" onPress={continueToPreview} />
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: 14, paddingTop: 6 }}>
          <View style={{ gap: 3 }}><Text style={{ color: colors.navy, fontSize: 19, fontWeight: "800" }}>Review before publishing</Text><Text style={styles.caption}>Check the content and settings. Go back if you want to make a change.</Text></View>
          <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Avatar name={identityKind === "business" ? activeBusiness?.name ?? "Business" : app.user.name} image={identityKind === "business" ? activeBusiness?.logo : app.user.avatar} size={36} />
              <View style={{ flex: 1 }}><Text style={{ color: colors.navy, fontSize: 14, fontWeight: "800" }}>{identityKind === "business" ? activeBusiness?.name ?? businessId : app.user.name}</Text><Text style={{ color: colors.muted, fontSize: 11 }}>{audience} {location ? `· ${location}` : ""}</Text></View>
              <Text style={{ color: colors.emeraldDark, fontSize: 11, fontWeight: "800" }}>{selectedType.toUpperCase()}</Text>
            </View>
            {showPoll ? <View style={{ gap: 7 }}><Text style={{ color: colors.navy, fontSize: 15, fontWeight: "800" }}>{pollQuestion}</Text>{pollOptions.filter((option) => option.trim()).map((option, index) => <View key={`${index}-${option}`} style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}><Text style={styles.body}>{option}</Text></View>)}</View> : null}
            {kind === "product" && !showPoll ? <View style={{ gap: 4 }}><Text style={{ color: colors.navy, fontSize: 17, fontWeight: "800" }}>{productName}</Text>{productPrice.trim() ? <Text style={{ color: colors.emeraldDark, fontSize: 15, fontWeight: "800" }}>{productPrice}</Text> : null}{productUrl.trim() ? <Text style={{ color: colors.emeraldDark, fontSize: 12 }}>{productUrl}</Text> : null}</View> : null}
            {kind === "announcement" && !showPoll ? <Text style={{ color: colors.navy, fontSize: 17, fontWeight: "800" }}>{announcementTitle}</Text> : null}
            {caption.trim() ? <Text style={{ color: colors.navy, fontSize: 14, lineHeight: 20 }}>{caption.trim()}</Text> : null}
            {pickedStrip}
            {urls.trim() ? <Text style={styles.caption}>{urls.split(/\n|,/).filter((url) => url.trim()).length} hosted media attachment(s)</Text> : null}
          </View>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 13, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}><Text style={styles.body}>Audience</Text><Text style={{ ...styles.body, textTransform: "capitalize" }}>{audience}</Text></View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 13, backgroundColor: colors.surface }}><Text style={styles.body}>Comments</Text><Text style={styles.body}>{allowComments ? "On" : "Off"}</Text></View>
          </View>
          {busyLabel ? <Text style={styles.caption}>{busyLabel}</Text> : null}
          <Button title={busy ? "Publishing…" : "Publish post"} disabled={busy || !app.isAuthenticated} onPress={() => void publish()} />
          <Button title="Edit post" variant="outline" disabled={busy} onPress={() => setStep(2)} />
        </View>
      ) : null}
    </Page>
  );
}
export function ApiPostDetail({ postId }: { postId: string }) {
  const services = useMabizServices();
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
    setLoading(true);
    setError("");
    setCommentError("");
    const [postResult, commentsResult] = await Promise.all([
      services.posts.get(postId),
      services.posts.listComments(postId, pageRequest()),
    ]);
    if (!postResult.ok) setError(errorText(postResult.error));
    else setPost(postResult.data);
    if (!commentsResult.ok) setCommentError(errorText(commentsResult.error));
    else setComments(commentsResult.data.items);
    setLoading(false);
  }, [postId, services]);
  useEffect(() => {
    void load();
  }, [load]);
  const send = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    setBusy(true);
    setCommentError("");
    const result = replyTo
      ? await services.posts.reply(postId, replyTo.id, { text })
      : await services.posts.comment(postId, { text });
    if (!result.ok) setCommentError(errorText(result.error));
    else {
      setCommentText("");
      setReplyTo(null);
      await load();
    }
    setBusy(false);
  };
  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title="Post" back />
      {error ? (
        <View accessibilityRole="alert" style={{ gap: 8 }}>
          <Text style={styles.body}>Post error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading post and comments" /> : null}
      {!loading && !error && post ? (
        <>
          <ApiPostCard post={post} />
          <SectionTitle title={`Comments · ${post.commentCount ?? comments.length}`} />
          {commentError ? (
            <Text accessibilityRole="alert" style={{ ...styles.body, color: colors.danger }}>
              Comments error: {commentError}
            </Text>
          ) : null}
          {comments.map((comment) => (
            <View key={comment.id} style={{ gap: 8 }}>
              <View style={styles.actionTile}>
                <Avatar name={comment.userName} image={comment.userAvatar} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{comment.userName}</Text>
                  <Text style={styles.body}>{comment.text}</Text>
                </View>
                <Button
                  title="Reply"
                  small
                  variant="quiet"
                  onPress={() => {
                    setReplyTo(comment);
                    setCommentText("");
                  }}
                />
              </View>
              {comment.replyCount ? <Replies comment={comment} /> : null}
            </View>
          ))}
          {comments.length === 0 && !commentError ? (
            <EmptyState title="No comments yet" detail="Start the conversation." icon="chatbubbles-outline" />
          ) : null}
          {post.allowComments === false ? (
            <Text style={styles.caption}>Comments are disabled for this post.</Text>
          ) : (
            <>
              {replyTo ? (
                <View style={styles.rowBetween}>
                  <Text style={styles.caption}>Replying to {replyTo.userName}</Text>
                  <Button
                    title="Cancel reply"
                    small
                    variant="quiet"
                    onPress={() => {
                      setReplyTo(null);
                      setCommentText("");
                    }}
                  />
                </View>
              ) : null}
              <Field
                label={replyTo ? "Write a reply" : "Add a comment"}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                placeholder="Share a helpful thought…"
              />
              <Button
                title={busy ? "Sending…" : replyTo ? "Send reply" : "Comment"}
                icon="send-outline"
                disabled={busy || !app.isAuthenticated}
                onPress={() => void send()}
              />
            </>
          )}
        </>
      ) : null}
    </Page>
  );
}

function Replies({ comment }: { comment: SocialApiComment }) {
  const services = useMabizServices();
  const [replies, setReplies] = useState<SocialApiComment[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let mounted = true;
    services.posts.listReplies(comment.id, pageRequest()).then((result) => {
      if (!mounted) return;
      if (!result.ok) setError(errorText(result.error));
      else setReplies(result.data.items);
    });
    return () => {
      mounted = false;
    };
  }, [comment.id, services]);
  return (
    <View style={{ marginLeft: 34, gap: 6 }}>
      {error ? (
        <Text accessibilityRole="alert" style={styles.caption}>
          Replies unavailable: {error}
        </Text>
      ) : (
        replies.map((reply) => (
          <View key={reply.id} style={styles.actionTile}>
            <Avatar name={reply.userName} image={reply.userAvatar} size={28} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{reply.userName}</Text>
              <Text style={styles.body}>{reply.text}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export function ApiPersonProfile({ personId }: { personId: string }) {
  const services = useMabizServices();
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
    setLoading(true);
    setError("");
    const profileId = isSelf ? "me" : personId;
    const [profileResult, postsResult, followResult] = await Promise.all([
      services.users.getProfile(profileId),
      services.posts.listUserPosts(profileId, pageRequest()),
      isSelf ? Promise.resolve(null) : services.users.getFollowStatus(personId),
    ]);
    if (!profileResult.ok) setError(errorText(profileResult.error));
    else setPerson(profileResult.data);
    if (!postsResult.ok)
      setError((current) =>
        current ? `${current}; posts: ${errorText(postsResult.error)}` : `Posts: ${errorText(postsResult.error)}`
      );
    else setPosts(postsResult.data.items);
    if (followResult) {
      if (!followResult.ok) setActionError(errorText(followResult.error));
      else {
        setFollowing(followResult.data.following);
        setFollowerCount(followResult.data.followerCount);
      }
    }
    setLoading(false);
  }, [isSelf, personId, services]);
  useEffect(() => {
    void load();
  }, [load]);
  const toggleFollow = async () => {
    setBusy(true);
    setActionError("");
    const result = following ? await services.users.unfollow(personId) : await services.users.follow(personId);
    if (!result.ok) setActionError(errorText(result.error));
    else {
      const status = await services.users.getFollowStatus(personId);
      if (!status.ok) setActionError(errorText(status.error));
      else {
        setFollowing(status.data.following);
        setFollowerCount(status.data.followerCount);
      }
    }
    setBusy(false);
  };
  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title="Founder profile" back />
      {error ? (
        <View accessibilityRole="alert">
          <Text style={styles.body}>Profile error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading profile from server" /> : null}
      {!loading && !error && person ? (
        <>
          <View style={{ alignItems: "center", gap: 8, padding: 16, backgroundColor: colors.surface, borderRadius: 20 }}>
            <Avatar name={person.name} image={person.avatar} size={82} ring />
            <Text style={styles.sectionHeading}>{person.name}</Text>
            <Text style={styles.caption}>
              @{person.username} · {person.town}, {person.county}
            </Text>
            <Text style={[styles.body, { textAlign: "center" }]}>{person.bio}</Text>
            <View style={styles.row}>
              <Stat value={followerCount ?? person.followers} label="Followers" />
              <Stat value={person.following} label="Following" />
              <Stat value={posts.length} label="Posts" />
            </View>
            {!isSelf ? (
              <Button
                title={busy ? "Working…" : following ? "Following · unfollow" : "Follow"}
                icon={following ? "checkmark" : "person-add-outline"}
                variant={following ? "soft" : "primary"}
                disabled={busy || !app.isAuthenticated}
                onPress={() => void toggleFollow()}
              />
            ) : null}
            {actionError ? (
              <Text accessibilityRole="alert" style={{ ...styles.caption, color: colors.danger }}>
                Follow error: {actionError}
              </Text>
            ) : null}
            <Button title="Followers & following" variant="outline" onPress={() => router.push("/menu/followers")} />
          </View>
          <SectionTitle title="Posts" />
          {posts.length ? (
            posts.map((post) => <ApiPostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              title="No posts"
              detail="This profile has not published posts visible to you."
              icon="albums-outline"
            />
          )}
        </>
      ) : null}
    </Page>
  );
}

export function ApiBusinessProfile({ businessId }: { businessId: string }) {
  const services = useMabizServices();
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
    setLoading(true);
    setError("");
    const [businessResult, postsResult, followResult] = await Promise.all([
      services.businesses.get(businessId),
      services.posts.listBusinessPosts(businessId, pageRequest()),
      services.businesses.getFollowStatus(businessId),
    ]);
    if (!businessResult.ok) setError(errorText(businessResult.error));
    else setBusiness(businessResult.data);
    if (!postsResult.ok)
      setError((current) =>
        current ? `${current}; posts: ${errorText(postsResult.error)}` : `Posts: ${errorText(postsResult.error)}`
      );
    else setPosts(postsResult.data.items);
    if (!followResult.ok) setActionError(errorText(followResult.error));
    else {
      setFollowing(followResult.data.following);
      setFollowerCount(followResult.data.followerCount);
    }
    setLoading(false);
  }, [businessId, services]);
  useEffect(() => {
    void load();
  }, [load]);
  const toggleFollow = async () => {
    setBusy(true);
    setActionError("");
    const result = following
      ? await services.businesses.unfollow(businessId)
      : await services.businesses.follow(businessId);
    if (!result.ok) setActionError(errorText(result.error));
    else {
      const status = await services.businesses.getFollowStatus(businessId);
      if (!status.ok) setActionError(errorText(status.error));
      else {
        setFollowing(status.data.following);
        setFollowerCount(status.data.followerCount);
      }
    }
    setBusy(false);
  };
  const startEnquiry = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    setBusy(true);
    setActionError("");
    const result = await services.messaging.startConversation({
      businessId,
      firstMessage: "Hello, I would like to learn more about your business.",
    });
    if (!result.ok) setActionError(errorText(result.error));
    else router.push({ pathname: "/messages/[id]", params: { id: result.data.id } });
    setBusy(false);
  };
  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title="Business profile" back />
      {error ? (
        <View accessibilityRole="alert">
          <Text style={styles.body}>Business profile error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading business profile" /> : null}
      {!loading && !error && business ? (
        <>
          <View style={{ padding: 17, borderRadius: 20, backgroundColor: colors.surface, gap: 9, alignItems: "center" }}>
            <Avatar name={business.name} image={business.logo} size={78} ring />
            <Text style={styles.sectionHeading}>{business.name}</Text>
            <Text style={styles.caption}>
              {business.category} · {business.town}, {business.county}
            </Text>
            <Text style={styles.body}>{business.description}</Text>
            <Stat value={followerCount ?? business.followers} label="Followers" />
            <Button
              title={busy ? "Working…" : following ? "Following · unfollow" : "Follow business"}
              icon={following ? "checkmark" : "add-outline"}
              variant={following ? "soft" : "primary"}
              disabled={busy || !app.isAuthenticated}
              onPress={() => void toggleFollow()}
            />
            <Button
              title="Message business"
              icon="chatbubble-outline"
              variant="outline"
              disabled={busy}
              onPress={() => void startEnquiry()}
            />
            {actionError ? (
              <Text accessibilityRole="alert" style={{ ...styles.caption, color: colors.danger }}>
                Follow error: {actionError}
              </Text>
            ) : null}
            <Button
              title="View followers"
              variant="outline"
              onPress={() => router.push({ pathname: "/menu/followers", params: { businessId } })}
            />
          </View>
          <SectionTitle title={`Posts · ${posts.length}`} />
          {posts.length ? (
            posts.map((post) => <ApiPostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              title="No posts yet"
              detail="Business posts that are visible to you will appear here."
              icon="albums-outline"
            />
          )}
        </>
      ) : null}
    </Page>
  );
}

export function ApiFollowersScreen({ selectedBusinessId }: { selectedBusinessId?: string }) {
  const services = useMabizServices();
  const app = useAppStore();
  const [list, setList] = useState<"Followers" | "Following">("Following");
  const [mode, setMode] = useState<"People" | "Businesses">("People");
  const [businessId, setBusinessId] = useState(selectedBusinessId ?? "");
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (mode === "Businesses" && list === "Following") {
      setPeople([]);
      setLoading(false);
      return;
    }
    if (mode === "Businesses" && !businessId.trim()) {
      setPeople([]);
      setError("Select or enter a business ID to view its followers.");
      setLoading(false);
      return;
    }
    const result =
      mode === "People"
        ? list === "Followers"
          ? await services.users.listFollowers("me", pageRequest())
          : await services.users.listFollowing("me", pageRequest())
        : await services.businesses.listFollowers(businessId.trim(), pageRequest());
    if (!result.ok) setError(errorText(result.error));
    else setPeople(result.data.items);
    setLoading(false);
  }, [businessId, list, mode, services]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title="Followers & following" back />
      {!app.isAuthenticated ? (
        <EmptyState
          title="Sign in to view social lists"
          detail="These lists require an authenticated API session."
          icon="lock-closed-outline"
          action="Sign in"
          onAction={() => router.push("/auth/login")}
        />
      ) : (
        <>
          <View style={styles.row}>
            <Chip label="Followers" selected={list === "Followers"} onPress={() => setList("Followers")} />
            <Chip label="Following" selected={list === "Following"} onPress={() => setList("Following")} />
          </View>
          <View style={styles.row}>
            <Chip label="People" selected={mode === "People"} onPress={() => setMode("People")} />
            <Chip label="Businesses" selected={mode === "Businesses"} onPress={() => setMode("Businesses")} />
          </View>
          {mode === "Businesses" ? (
            <Field
              label="Business ID (required for business followers)"
              value={businessId}
              onChangeText={setBusinessId}
              placeholder="Business ID"
              autoCapitalize="none"
            />
          ) : null}
          {mode === "Businesses" && list === "Following" ? (
            <Text style={styles.caption}>The API does not provide a business-following list route yet.</Text>
          ) : null}
          {error ? (
            <View accessibilityRole="alert">
              <Text style={{ ...styles.body, color: colors.danger }}>List error: {error}</Text>
              <Button title="Retry" small variant="outline" onPress={() => void load()} />
            </View>
          ) : null}
          {loading ? <LoadingState label="Loading list from server" /> : null}
          {!loading && !error && !people.length && !(mode === "Businesses" && list === "Following") ? (
            <EmptyState
              title={list === "Followers" ? "No followers yet" : "Not following anyone yet"}
              detail="This list is returned by the server."
              icon="people-outline"
            />
          ) : null}
          {people.map((person) => (
            <Pressable
              key={person.id}
              onPress={() => router.push({ pathname: "/person/[id]", params: { id: person.id } })}
              style={styles.actionTile}
            >
              <Avatar name={person.name} image={person.avatar} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{person.name}</Text>
                <Text style={styles.caption}>
                  @{person.username} · {person.town}
                </Text>
              </View>
            </Pressable>
          ))}
        </>
      )}
    </Page>
  );
}
type ProfileTab = "all" | "videos" | "reshared" | "saved";

const PROFILE_TABS: { key: ProfileTab; icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }[] = [
  { key: "all", icon: "grid-outline", label: "All posts" },
  { key: "videos", icon: "play-circle-outline", label: "Videos" },
  { key: "reshared", icon: "repeat-outline", label: "Reshared" },
  { key: "saved", icon: "bookmark-outline", label: "Saved" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoosePost = Record<string, any>;
const mediaListOf = (p: LoosePost): LoosePost[] => p.mediaReferences ?? p.media ?? [];
const postIsVideo = (p: LoosePost) =>
  p.kind === "video" || p.mediaType === "video" || mediaListOf(p).some((m) => m.mediaType === "video");
const postIsReshared = (p: LoosePost) =>
  Boolean(p.resharedFromId || p.originalPostId || p.isReshare || p.reshared || p.kind === "reshare");
const postThumb = (p: LoosePost): string | undefined => {
  const first = mediaListOf(p).find((m) => m.mediaType !== "video") ?? mediaListOf(p)[0];
  return p.thumbnail ?? p.image ?? p.imageUrl ?? first?.thumbnailUrl ?? first?.url ?? first?.uri;
};

function ApiProfileTile({ post, size }: { post: Post; size: number }) {
  const loose = post as LoosePost;
  const uri = postThumb(loose);
  const video = postIsVideo(loose);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open post"
      onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.subtle,
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        overflow: "hidden",
      }}
    >
      {uri && !video ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : video ? (
        <Ionicons name="videocam" size={28} color={colors.muted} />
      ) : (
        <Text numberOfLines={5} style={[styles.caption, { textAlign: "center" }]}>
          {loose.caption ?? loose.text ?? ""}
        </Text>
      )}
      {video ? (
        <Ionicons name="play" size={16} color={colors.navy} style={{ position: "absolute", top: 6, right: 6 }} />
      ) : postIsReshared(loose) ? (
        <Ionicons name="repeat" size={16} color={colors.navy} style={{ position: "absolute", top: 6, right: 6 }} />
      ) : null}
    </Pressable>
  );
}

export function ApiPersonalProfile() {
  const services = useMabizServices();
  const app = useAppStore();
  const { width } = useWindowDimensions();
  const [person, setPerson] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [businessPosts, setBusinessPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<ProfileTab>("all");
  const [businessMode, setBusinessMode] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [businessError, setBusinessError] = useState("");
  const replaceApiBusinesses = app.replaceApiBusinesses;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [profile, page] = await Promise.all([
      services.users.getProfile("me"),
      services.posts.listUserPosts("me", pageRequest()),
    ]);
    if (!profile.ok) setError(errorText(profile.error));
    else setPerson(profile.data);
    if (!page.ok)
      setError((current) =>
        current ? `${current}; posts: ${errorText(page.error)}` : `Posts: ${errorText(page.error)}`
      );
    else setPosts(page.data.items);
    setLoading(false);
  }, [services]);
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!app.isAuthenticated) return;
    let active = true;
    setBusinessLoading(true);
    void services.businesses
      .list({ limit: 100 })
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          replaceApiBusinesses(result.data.items);
          setBusinessError("");
        } else setBusinessError(errorText(result.error));
        setBusinessLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setBusinessError(cause instanceof Error ? cause.message : "Could not load managed businesses.");
        setBusinessLoading(false);
      });
    return () => {
      active = false;
    };
  }, [app.isAuthenticated, services, replaceApiBusinesses]);

  const managed = app.businesses.filter((b) => Boolean(b.currentUserRole || b.ownerId === app.user.id));
  const activeBusiness = app.businesses.find((b) => b.id === app.activeBusinessId);
  const inBusiness = businessMode && Boolean(activeBusiness);
  const activeBusinessId = activeBusiness?.id;

  useEffect(() => {
    if (!businessMode || !activeBusinessId) {
      setBusinessPosts([]);
      return;
    }
    let active = true;
    void services.posts.listBusinessPosts(activeBusinessId, pageRequest()).then((result) => {
      if (!active) return;
      if (result.ok) setBusinessPosts(result.data.items);
      else setBusinessError(errorText(result.error));
    });
    return () => {
      active = false;
    };
  }, [businessMode, activeBusinessId, services]);

  const shownPosts = inBusiness ? businessPosts : posts;
  const tabPosts = useMemo(
    () =>
      tab === "videos"
        ? shownPosts.filter((p) => postIsVideo(p as LoosePost))
        : tab === "reshared"
          ? shownPosts.filter((p) => postIsReshared(p as LoosePost))
          : shownPosts,
    [tab, shownPosts]
  );

  const tileSize = Math.floor((width - 32 - 4) / 3);
  const emptyText: Record<ProfileTab, string> = {
    all: "No posts yet.",
    videos: "No videos yet.",
    reshared: "Nothing reshared yet.",
    saved: "",
  };

  const displayName = inBusiness && activeBusiness ? activeBusiness.name : person?.name ?? "";
  const displayHandle = inBusiness && activeBusiness ? activeBusiness.slug : person?.username ?? "";
  const displayAbout = inBusiness && activeBusiness ? activeBusiness.description : person?.bio;

  const shareProfile = () => {
    if (!person) return;
    void Share.share({
      message: `Check out ${displayName} (@${displayHandle}) on Mabiz - connect with local businesses and founders!`,
    });
  };

  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar
        title={person ? `@${displayHandle}` : "Profile"}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            onPress={() => router.push("/menu")}
            hitSlop={8}
            style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="menu-outline" size={26} color={colors.navy} />
          </Pressable>
        }
      />
      {error ? (
        <View accessibilityRole="alert">
          <Text style={styles.body}>Profile error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading your profile from server" /> : null}
      {!loading && !error && person ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <Avatar
              name={displayName}
              image={inBusiness && activeBusiness ? activeBusiness.logo : person.avatar}
              size={82}
              ring
            />
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
              <Stat value={shownPosts.length} label="Posts" />
              <Pressable accessibilityRole="button" onPress={() => router.push("/menu/followers")}>
                <Stat
                  value={inBusiness && activeBusiness ? activeBusiness.followers : person.followers}
                  label="Followers"
                />
              </Pressable>
              {inBusiness ? null : (
                <Pressable accessibilityRole="button" onPress={() => router.push("/menu/followers")}>
                  <Stat value={person.following} label="Following" />
                </Pressable>
              )}
            </View>
          </View>

          <View style={{ gap: 2 }}>
            <Text style={styles.sectionHeading}>{displayName}</Text>
            <Text style={styles.caption}>
              {inBusiness && activeBusiness
                ? `${activeBusiness.category} - ${activeBusiness.town}`
                : `${person.town}, ${person.county}`}
            </Text>
            {displayAbout ? <Text style={styles.body}>{displayAbout}</Text> : null}
          </View>

          <View style={{ flexDirection: "row", gap: 9 }}>
            <View style={{ flex: 1 }}>
              <Button
                title={inBusiness ? "Manage business" : "Edit profile"}
                icon={inBusiness ? "settings-outline" : "create-outline"}
                variant="outline"
                small
                onPress={() => router.push(inBusiness ? "/business-management" : "/menu/account/personal-details")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Share profile" icon="share-outline" variant="outline" small onPress={shareProfile} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 9 }}>
            <Button
              title="Personal profile"
              icon="person-outline"
              variant={!businessMode ? "primary" : "outline"}
              small
              onPress={() => {
                setBusinessMode(false);
                app.switchIdentity(undefined);
              }}
            />
            <Button
              title="Business identity"
              icon="business-outline"
              variant={businessMode ? "primary" : "outline"}
              small
              onPress={() => {
                setBusinessMode(true);
                app.switchIdentity(activeBusiness?.id ?? managed[0]?.id);
              }}
            />
          </View>

          {businessMode ? (
            <View style={{ gap: 8 }}>
              <SectionTitle title="Switch business" action="Add business" onAction={() => router.push("/create-business")} />
              {businessLoading ? (
                <Text style={styles.caption}>Loading managed businesses...</Text>
              ) : managed.length ? (
                managed.map((business) => (
                  <Pressable
                    key={business.id}
                    accessibilityRole="button"
                    onPress={() => app.switchIdentity(business.id)}
                    style={[
                      styles.actionTile,
                      { borderColor: app.activeBusinessId === business.id ? colors.emerald : colors.border },
                    ]}
                  >
                    <View style={styles.tileIcon}>
                      <Ionicons name="business-outline" size={18} color={colors.emeraldDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{business.name}</Text>
                      <Text style={styles.caption}>
                        {business.category} - {business.town} - {business.currentUserRole ?? "Team member"}
                      </Text>
                    </View>
                    {app.activeBusinessId === business.id ? (
                      <Ionicons name="checkmark-circle" size={19} color={colors.emerald} />
                    ) : null}
                  </Pressable>
                ))
              ) : (
                <Button title="Create your first business" onPress={() => router.push("/create-business")} />
              )}
              {businessError ? <Text style={styles.caption}>{businessError}</Text> : null}
              {activeBusiness ? (
                <>
                  <ActionTile
                    title="Manage business"
                    detail="Server-backed profile, team, invitations and ownership"
                    icon="settings-outline"
                    onPress={() => router.push("/business-management")}
                  />
                  <ActionTile
                    title="Growth dashboard"
                    detail="Reviews, trends, milestones and next opportunities"
                    icon="trending-up-outline"
                    onPress={() =>
                      router.push({ pathname: "/business-growth", params: { businessId: activeBusiness.id } })
                    }
                  />
                </>
              ) : null}
            </View>
          ) : managed.length ? (
            <View style={{ gap: 9 }}>
              <SectionTitle title="Your businesses" action="Create business" onAction={() => router.push("/create-business")} />
              {managed.map((business) => (
                <Pressable
                  key={business.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })}
                  style={styles.actionTile}
                >
                  <View style={styles.tileIcon}>
                    <Ionicons name="storefront-outline" size={19} color={colors.emerald} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{business.name}</Text>
                    <Text style={styles.caption}>
                      {business.category} - {business.town} - {business.currentUserRole ?? "Owner"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {PROFILE_TABS.map((item) => {
              const selected = tab === item.key;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="tab"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  onPress={() => setTab(item.key)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 2,
                    borderBottomColor: selected ? colors.emerald : "transparent",
                  }}
                >
                  <Ionicons name={item.icon} size={22} color={selected ? colors.emeraldDark : colors.muted} />
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.caption, { textAlign: "center" }]}>
            {PROFILE_TABS.find((item) => item.key === tab)?.label}
          </Text>

          {tab === "saved" ? (
            <View style={{ gap: 8 }}>
              <ActionTile
                title="Saved posts and stories"
                detail={`${app.savedPosts.length + app.savedStories.length} items saved`}
                icon="bookmark-outline"
                onPress={() => router.push("/menu/activity/saved")}
              />
              <ActionTile
                title="Saved businesses"
                detail="Places and founders to revisit"
                icon="heart-outline"
                onPress={() => router.push("/menu/activity/saved-businesses")}
              />
            </View>
          ) : tabPosts.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
              {tabPosts.map((post) => (
                <ApiProfileTile key={post.id} post={post} size={tileSize} />
              ))}
            </View>
          ) : (
            <EmptyState title={emptyText[tab]} detail="Posts you publish will appear here." icon="albums-outline" />
          )}
        </>
      ) : null}
      <Text style={styles.caption}>
        Signed in as {app.user.username} - profile and post visibility are determined by server responses.
      </Text>
    </Page>
  );
}