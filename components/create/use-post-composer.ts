import { router } from "expo-router";
import { useState } from "react";
import { useAppStore } from "@/hooks/use-app-store";
import type { ContentAudience, ContentKind, Post } from "@/types/domain";
import type { PostComposerSnapshot } from "@/types/create-studio";
import { newLocalId } from "@/utils/ids";
import { alertUser, postDraft } from "@/components/create/create-helpers";

type AppStore = ReturnType<typeof useAppStore>;

export function usePostComposer(app: AppStore, draftId?: string, postId?: string) {
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

  return {
    app,
    step,
    setStep,
    kind,
    setKind,
    caption,
    setCaption,
    media,
    setMedia,
    setMediaItems,
    location,
    setLocation,
    audience,
    setAudience,
    commentsOn,
    setCommentsOn,
    sharingOn,
    setSharingOn,
    selectedProductId,
    setSelectedProductId,
    taggedBusinesses,
    setTaggedBusinesses,
    activePicker,
    setActivePicker,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollOptions,
    loading,
    showPublishConfirm,
    setShowPublishConfirm,
    showScheduleConfirm,
    setShowScheduleConfirm,
    identity,
    productsForIdentity,
    selectedProduct,
    handleSaveDraft,
    selectMediaFiles,
    cycleIdentity,
    finalizePublish,
  };
}

export type PostComposer = ReturnType<typeof usePostComposer>;