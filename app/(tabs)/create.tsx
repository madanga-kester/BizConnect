import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import {
  Avatar,
  Button,
  Chip,
  ConfirmModal,
  EmptyState,
  Field,
  LoadingState,
  MediaImage,
  Page,
  TopBar,
  VideoPreview,
} from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServiceMode } from "@/lib/services/service-provider";
import { ApiPostComposer } from "@/components/api-social-screens";
import { colors } from "@/theme/tokens";
import type { ContentAudience, ContentKind, Post } from "@/types/domain";
import type { PersistedComposerDraft, PostComposerSnapshot } from "@/types/create-studio";
import { newLocalId } from "@/utils/ids";

function alertUser(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

function postDraft(id: string, snapshot: PostComposerSnapshot): PersistedComposerDraft {
  return {
    id,
    kind: snapshot.kind,
    caption: snapshot.caption,
    media: snapshot.media,
    mediaItems: snapshot.mediaItems,
    identityId: snapshot.identityId,
    businessTags: snapshot.businessTags,
    productId: snapshot.productId,
    location: snapshot.location,
    updatedAt: new Date().toISOString(),
    draftType: "post",
    composer: { version: 1, mode: "post", post: snapshot },
  };
}

export default function CreateScreen() {
  const apiMode = useBizConnectServiceMode() === "api";
  return apiMode ? <ApiPostComposer /> : <MockCreateScreen />;
}

function MockCreateScreen() {
  const app = useAppStore();
  const { draftId, postId } = useLocalSearchParams<{ draftId?: string; postId?: string }>();

  if (!app.hasHydrated) {
    return (
      <Page>
        <TopBar title="Create post" back />
        <LoadingState label="Preparing studio..." />
      </Page>
    );
  }

  return <CreateWizard app={app} draftId={draftId} postId={postId} />;
}

function CreateWizard({
  app,
  draftId,
  postId,
}: {
  app: ReturnType<typeof useAppStore>;
  draftId?: string;
  postId?: string;
}) {
  const sourceDraft = draftId ? app.drafts.find((item) => item.id === draftId) : undefined;
  const sourcePost = postId ? app.posts.find((item) => item.id === postId && item.authorId === app.user.id) : undefined;
  const sourceContent = sourcePost ?? sourceDraft;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [editingDraftId, setEditingDraftId] = useState<string | undefined>(() => sourceDraft?.id ?? newLocalId("draft"));

  const [kind, setKind] = useState<ContentKind>(sourceContent?.kind ?? "text");
  const [caption, setCaption] = useState(sourceContent?.caption ?? "");
  const [media, setMedia] = useState<string | undefined>(sourceContent?.media);
  const [mediaItems, setMediaItems] = useState<string[]>(
    sourceContent?.mediaItems ?? (sourceContent?.media ? [sourceContent.media] : [])
  );
  const [identityId, setIdentityId] = useState<string | undefined>(
    sourceContent?.identityId ?? app.activeBusinessId ?? app.user.id
  );
  const [location, setLocation] = useState(sourceContent?.location ?? `${app.user.town}, ${app.user.county}`);
  const [audience, setAudience] = useState<ContentAudience>("public");
  const [commentsOn, setCommentsOn] = useState(true);
  const [sharingOn, setSharingOn] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(sourceContent?.productId);
  const [taggedBusinesses, setTaggedBusinesses] = useState<string[]>(sourceContent?.businessTags ?? []);

  const [activePicker, setActivePicker] = useState<"none" | "location" | "product" | "tag">("none");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const [loading, setLoading] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);

  const ownedBusinesses = app.isAuthenticated
    ? app.businesses.filter(
        (b) => b.ownerId === app.user.id || b.team.some((m) => m.userId === app.user.id)
      )
    : [];

  const identity = ownedBusinesses.find((b) => b.id === identityId);
  const productsForIdentity = (identity ? identity.products : app.businesses.flatMap((b) => b.products)).filter(
    (p) => !p.archived
  );
  const selectedProduct = productsForIdentity.find((p) => p.id === selectedProductId);

  const snapshot: PostComposerSnapshot = {
    kind,
    contentSubtype: "",
    caption,
    media,
    mediaItems,
    identityId: identity?.id ?? app.user.id,
    businessTags: taggedBusinesses,
    productId: selectedProductId,
    location,
    pollQuestion,
    pollOptions,
    pollDurationHours: "24",
    pollMultipleChoice: false,
    audience,
    allowComments: commentsOn,
    allowSharing: sharingOn,
    founderPrompt: "",
    videoSubtitles: "",
    mediaTextOverlay: "",
  };

  const handleSaveDraft = () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    const id = editingDraftId ?? newLocalId("draft");
    app.saveDraft(postDraft(id, snapshot));
    setEditingDraftId(id);
    alertUser("Draft saved", "Stored securely on this device.");
  };

  const selectMediaFiles = async (type: "images" | "videos") => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        alertUser("Permission required", "Allow access to media library.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [type === "images" ? "images" : "videos"],
        allowsMultipleSelection: type === "images",
        quality: 0.75,
      });
      if (res.canceled || !res.assets[0]) return;
      const uris = res.assets.map((a) => a.uri);
      setMediaItems(uris);
      setMedia(uris[0]);
      setKind(type === "images" ? "image" : "video");
    } catch {
      alertUser("Unavailable", "Media selection not supported in this environment.");
    }
  };

  const cycleIdentity = () => {
    if (!ownedBusinesses.length) {
      alertUser("Personal profile", "Create a business profile to switch posting identities.");
      return;
    }
    if (!identity) {
      setIdentityId(ownedBusinesses[0].id);
      return;
    }
    const idx = ownedBusinesses.findIndex((b) => b.id === identity.id);
    const next = ownedBusinesses[idx + 1];
    setIdentityId(next ? next.id : app.user.id);
  };

  const finalizePublish = async (isScheduled = false) => {
    setShowPublishConfirm(false);
    setShowScheduleConfirm(false);
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));

    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    const createdAt = new Date().toISOString();

    const postData: Post = {
      id: sourcePost?.id ?? newLocalId("post"),
      authorId: app.user.id,
      identityKind: identity ? "business" : "personal",
      identityId: identity?.id ?? app.user.id,
      kind,
      caption: caption.trim(),
      media,
      mediaItems,
      audience,
      allowComments: commentsOn,
      allowSharing: sharingOn,
      location,
      businessId: identity?.id,
      businessTags: taggedBusinesses,
      productId: selectedProductId,
      ...(kind === "poll" && cleanOptions.length >= 2
        ? {
            poll: {
              question: pollQuestion.trim() || caption.trim(),
              options: cleanOptions.map((text) => ({ id: newLocalId("poll-opt"), text })),
              endsAt: new Date(Date.now() + 86400000).toISOString(),
              multipleChoice: false,
              votes: [],
            },
          }
        : {}),
      createdAt: sourcePost?.createdAt ?? createdAt,
      likes: sourcePost?.likes ?? 0,
      comments: sourcePost?.comments ?? [],
      hashtags: sourcePost?.hashtags ?? [],
    };

    if (isScheduled) {
      app.schedulePost(postData, new Date(Date.now() + 86400000).toISOString());
    } else if (sourcePost) {
      app.updatePost(sourcePost.id, postData);
    } else {
      app.addPost(postData);
    }

    if (editingDraftId) app.removeDraft(editingDraftId);
    setLoading(false);
    alertUser(
      isScheduled ? "Post scheduled" : "Success",
      isScheduled ? "Your post is scheduled for tomorrow." : "Post shared successfully!"
    );
    router.replace("/(tabs)");
  };

  return (
    <Page>
      {/* Top Navigation Bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
        <Pressable
          onPress={() => (step > 1 ? setStep((s) => (s === 3 ? 2 : 1)) : router.back())}
          style={{ padding: 4 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
        <Text style={{ color: colors.navy, fontSize: 17, fontWeight: "800" }}>Create post</Text>
        <Pressable onPress={handleSaveDraft}>
          <Text style={{ color: colors.emeraldDark, fontSize: 14, fontWeight: "700" }}>Save draft</Text>
        </Pressable>
      </View>

      {!app.isAuthenticated ? (
        <EmptyState
          title="Sign in to create posts"
          detail="Publishing and saving drafts require sign-in."
          icon="lock-closed-outline"
          action="Sign in"
          onAction={() => router.push("/auth/login")}
        />
      ) : null}

      {/* ================= STEP 1: WRITE & SELECT FORMAT ================= */}
      {step === 1 && (
        <View style={{ gap: 14, paddingTop: 4 }}>
          <Pressable onPress={cycleIdentity} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Avatar name={identity?.name ?? app.user.name} image={identity?.logo ?? app.user.avatar} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.navy, fontSize: 15, fontWeight: "800" }}>
                {identity?.name ?? app.user.name}
              </Text>
              <View
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 2,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                  backgroundColor: colors.subtle,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
                  {identity ? "Posting to your business" : "Posting to your profile"}
                </Text>
                <Ionicons name="chevron-down" size={12} color={colors.muted} />
              </View>
            </View>
          </Pressable>

          <TextInput
            style={{
              color: colors.navy,
              fontSize: 16,
              minHeight: 170,
              textAlignVertical: "top",
              paddingTop: 4,
            }}
            placeholder="What would you like to share?"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            value={caption}
            onChangeText={setCaption}
          />

          {kind === "poll" ? (
            <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.subtle }}>
              <Field
                label="Poll question"
                placeholder="Ask a question..."
                value={pollQuestion}
                onChangeText={setPollQuestion}
              />
              {pollOptions.map((opt, i) => (
                <Field
                  key={i}
                  label={`Option ${i + 1}`}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChangeText={(val) => setPollOptions((prev) => prev.map((item, idx) => (idx === i ? val : item)))}
                />
              ))}
              {pollOptions.length < 4 ? (
                <Button
                  title="Add option"
                  small
                  variant="outline"
                  onPress={() => setPollOptions((prev) => [...prev, ""])}
                />
              ) : null}
            </View>
          ) : null}

          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontVariant: ["tabular-nums"] }}>
              {caption.length}/1000
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {(
              [
                { label: "Post", value: "text", icon: "create-outline" },
                { label: "Question", value: "question", icon: "help-circle-outline" },
                { label: "Poll", value: "poll", icon: "stats-chart-outline" },
                { label: "Business update", value: "announcement", icon: "business-outline" },
              ] as const
            ).map((item) => {
              const active = kind === item.value || (item.value === "text" && (kind === "image" || kind === "video"));
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setKind(item.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? colors.emerald : colors.subtle,
                  }}
                >
                  <Ionicons name={item.icon} size={15} color={active ? colors.white : colors.navy} />
                  <Text style={{ color: active ? colors.white : colors.navy, fontSize: 13, fontWeight: "700" }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            {[
              { label: "Photo", icon: "image-outline" as const, onPress: () => void selectMediaFiles("images") },
              { label: "Video", icon: "videocam-outline" as const, onPress: () => void selectMediaFiles("videos") },
              {
                label: "Tag",
                icon: "person-add-outline" as const,
                onPress: () => {
                  setActivePicker("tag");
                  setStep(2);
                },
              },
              {
                label: "Location",
                icon: "location-outline" as const,
                onPress: () => {
                  setActivePicker("location");
                  setStep(2);
                },
              },
            ].map((tool) => (
              <Pressable
                key={tool.label}
                onPress={tool.onPress}
                style={{
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: colors.subtle,
                  marginHorizontal: 4,
                }}
              >
                <Ionicons name={tool.icon} size={20} color={colors.navy} />
                <Text style={{ color: colors.navy, fontSize: 11, fontWeight: "600" }}>{tool.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 12 }}>
            <Button
              title="Next"
              onPress={() => {
                if (caption.trim().length < 2 && !media) {
                  alertUser("Content required", "Write something or attach media before proceeding.");
                  return;
                }
                setStep(2);
              }}
            />
          </View>
        </View>
      )}

      {/* ================= STEP 2: ADD TO YOUR POST ================= */}
      {step === 2 && (
        <View style={{ gap: 14, paddingTop: 4 }}>
          <Text style={{ color: colors.navy, fontSize: 18, fontWeight: "800" }}>Add to your post</Text>

          <Pressable
            onPress={() => void selectMediaFiles("images")}
            style={{
              padding: 24,
              borderRadius: 16,
              backgroundColor: colors.subtle,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons name="images-outline" size={32} color={colors.muted} />
            <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "700" }}>Add photos or videos</Text>
          </Pressable>

          {media ? (
            <View style={{ position: "relative", alignSelf: "flex-start" }}>
              {kind === "video" ? (
                <VideoPreview uri={media} height={130} />
              ) : (
                <MediaImage uri={media} height={120} label="Attached media" />
              )}
              <Pressable
                onPress={() => {
                  setMedia(undefined);
                  setMediaItems([]);
                }}
                style={{
                  position: "absolute",
                  right: 6,
                  top: 6,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.navy,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={14} color={colors.white} />
              </Pressable>
            </View>
          ) : null}

          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: "hidden" }}>
            {[
              {
                label: taggedBusinesses.length ? `Tagged (${taggedBusinesses.length})` : "Tag people",
                icon: "person-outline" as const,
                key: "tag" as const,
              },
              {
                label: location ? `Location · ${location}` : "Add location",
                icon: "location-outline" as const,
                key: "location" as const,
              },
              {
                label: selectedProduct ? `Product · ${selectedProduct.name}` : "Add product",
                icon: "pricetag-outline" as const,
                key: "product" as const,
              },
            ].map((row, idx, arr) => (
              <Pressable
                key={row.key}
                onPress={() => setActivePicker(activePicker === row.key ? "none" : row.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 14,
                  backgroundColor: colors.surface,
                  borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  gap: 12,
                }}
              >
                <Ionicons name={row.icon} size={20} color={colors.navy} />
                <Text style={{ flex: 1, color: colors.navy, fontSize: 14, fontWeight: "600" }}>{row.label}</Text>
                <Ionicons
                  name={activePicker === row.key ? "chevron-down" : "chevron-forward"}
                  size={16}
                  color={colors.muted}
                />
              </Pressable>
            ))}
          </View>

          {activePicker === "location" ? (
            <Field label="Location" value={location} onChangeText={setLocation} placeholder="Town or county" />
          ) : null}

          {activePicker === "tag" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {app.businesses.map((b) => (
                <Chip
                  key={b.id}
                  label={b.name}
                  selected={taggedBusinesses.includes(b.id)}
                  onPress={() =>
                    setTaggedBusinesses((prev) =>
                      prev.includes(b.id) ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                    )
                  }
                />
              ))}
            </View>
          ) : null}

          {activePicker === "product" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {productsForIdentity.length ? (
                productsForIdentity.map((p) => (
                  <Chip
                    key={p.id}
                    label={`${p.name} · KSh ${p.price}`}
                    selected={selectedProductId === p.id}
                    onPress={() => setSelectedProductId(selectedProductId === p.id ? undefined : p.id)}
                  />
                ))
              ) : (
                <Text style={{ color: colors.muted, fontSize: 12 }}>No products in your catalogue yet.</Text>
              )}
            </View>
          ) : null}

          <View style={{ gap: 10, paddingVertical: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Ionicons name="globe-outline" size={20} color={colors.navy} />
                <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Audience</Text>
              </View>
              <Pressable
                onPress={() => setAudience(audience === "public" ? "followers" : "public")}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
                  {audience === "public" ? "Public" : "Followers"}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.muted} />
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.navy} />
                <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Comments</Text>
              </View>
              <Switch
                value={commentsOn}
                onValueChange={setCommentsOn}
                trackColor={{ false: colors.border, true: colors.emerald }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Button title="Back" variant="outline" onPress={() => setStep(1)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Next" onPress={() => setStep(3)} />
            </View>
          </View>
        </View>
      )}

      {/* ================= STEP 3: REVIEW POST ================= */}
      {step === 3 && (
        <View style={{ gap: 14, paddingTop: 4 }}>
          <Text style={{ color: colors.navy, fontSize: 18, fontWeight: "800" }}>Review post</Text>

          <View
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Avatar name={identity?.name ?? app.user.name} image={identity?.logo ?? app.user.avatar} size={36} />
                <View>
                  <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "800" }}>
                    {identity?.name ?? app.user.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="globe-outline" size={11} color={colors.muted} />
                    <Text style={{ color: colors.muted, fontSize: 11 }}>
                      {audience === "public" ? "Public" : "Followers"}
                    </Text>
                    <Ionicons name="chevron-down" size={10} color={colors.muted} />
                  </View>
                </View>
              </View>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
            </View>

            {media ? (
              kind === "video" ? (
                <VideoPreview uri={media} height={190} />
              ) : (
                <MediaImage uri={media} height={190} label="Post preview image" />
              )
            ) : null}

            <Text style={{ color: colors.navy, fontSize: 14, lineHeight: 20 }}>
              {caption || "No caption provided."}
            </Text>
          </View>

          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: "hidden" }}>
            <Pressable
              onPress={() => setAudience(audience === "public" ? "followers" : "public")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="globe-outline" size={18} color={colors.navy} />
                <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Audience</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
                  {audience === "public" ? "Public" : "Followers"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => setCommentsOn((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.navy} />
                <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Comments</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
                  {commentsOn ? "On" : "Off"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => setSharingOn((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
                backgroundColor: colors.surface,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="arrow-redo-outline" size={18} color={colors.navy} />
                <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Sharing</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
                  {sharingOn ? "On" : "Off"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
            </Pressable>
          </View>

          <View style={{ gap: 8, marginTop: 8 }}>
            <Button
              title={loading ? "Sharing..." : "Share post"}
              disabled={loading}
              onPress={() => setShowPublishConfirm(true)}
            />
            <Button
              title="Schedule"
              icon="time-outline"
              variant="outline"
              onPress={() => setShowScheduleConfirm(true)}
            />
          </View>
        </View>
      )}

      <ConfirmModal
        visible={showPublishConfirm}
        title="Share post?"
        detail="Your post will be published immediately."
        confirmLabel="Share"
        onCancel={() => setShowPublishConfirm(false)}
        onConfirm={() => void finalizePublish(false)}
      />

      <ConfirmModal
        visible={showScheduleConfirm}
        title="Schedule post?"
        detail="Your post will be queued for tomorrow."
        confirmLabel="Schedule"
        onCancel={() => setShowScheduleConfirm(false)}
        onConfirm={() => void finalizePublish(true)}
      />
    </Page>
  );
}