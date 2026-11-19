import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button, ConfirmModal, EmptyState, Field, LocalNote, MediaImage, Page, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { formatDate } from "@/utils/kenya";
import { newLocalId } from "@/utils/ids";
import type { PersistedComposerDraft } from "@/types/create-studio";
import { useThemeContext } from "@/lib/theme-provider";

function cloneDraft(draft: PersistedComposerDraft): PersistedComposerDraft {
  return {
    ...draft, id: newLocalId("draft"), updatedAt: new Date().toISOString(),
    mediaItems: draft.mediaItems ? [...draft.mediaItems] : undefined,
    businessTags: draft.businessTags ? [...draft.businessTags] : undefined,
    composer: draft.composer?.mode === "post" && draft.composer.post ? { ...draft.composer, post: { ...draft.composer.post, mediaItems: [...draft.composer.post.mediaItems], businessTags: [...draft.composer.post.businessTags], pollOptions: [...draft.composer.post.pollOptions] } } : draft.composer?.mode === "social-story" && draft.composer.story ? { ...draft.composer, story: { ...draft.composer.story, media: [...draft.composer.story.media] } } : draft.composer,
  };
}

export default function DraftsScreen() {
  useThemeContext();
  const app = useAppStore();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [deleteId, setDeleteId] = useState<string>();
  const [previewId, setPreviewId] = useState<string>();
  const drafts = useMemo(() => app.drafts.filter((draft) => `${draft.kind} ${draft.caption} ${app.businesses.find((business) => business.id === draft.identityId)?.name ?? app.user.name}`.toLocaleLowerCase("en-KE").includes(query.trim().toLocaleLowerCase("en-KE"))).sort((a, b) => sort === "newest" ? Date.parse(b.updatedAt) - Date.parse(a.updatedAt) : Date.parse(a.updatedAt) - Date.parse(b.updatedAt)), [app.drafts, app.businesses, app.user.name, query, sort]);
  if (!app.isAuthenticated) return <Page><TopBar title="Drafts" back /><EmptyState title="Sign in to see your local drafts" detail="Drafts belong to the authenticated demo session on this device." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  const edit = (draft: PersistedComposerDraft) => draft.draftType === "social-story" ? router.push({ pathname: "/create-social-story", params: { draftId: draft.id } }) : router.push({ pathname: "/(tabs)/create", params: { draftId: draft.id } });
  const remove = () => { if (deleteId) app.removeDraft(deleteId); setDeleteId(undefined); };
  const duplicate = (draft: PersistedComposerDraft) => { app.saveDraft(cloneDraft(draft)); };
  return <Page>
    <TopBar title="Drafts" back />
    <LocalNote text="Drafts and attached file references stay on this device · no server upload or sync" />
    <Field label="Search drafts" value={query} onChangeText={setQuery} placeholder="Search caption, format or identity" />
    <View style={styles.row}><Button title="Newest first" icon="arrow-down-outline" small variant={sort === "newest" ? "soft" : "outline"} onPress={() => setSort("newest")} /><Button title="Oldest first" icon="arrow-up-outline" small variant={sort === "oldest" ? "soft" : "outline"} onPress={() => setSort("oldest")} /><Text style={styles.caption}>{drafts.length} of {app.drafts.length}</Text></View>
    {drafts.length ? drafts.map((draft) => {
      const isStory = draft.draftType === "social-story";
      const storySnapshot = draft.composer?.mode === "social-story" ? draft.composer.story : undefined;
      const postSnapshot = draft.composer?.mode === "post" ? draft.composer.post : undefined;
      const identity = app.businesses.find((business) => business.id === draft.identityId)?.name ?? app.user.name;
      const expanded = previewId === draft.id;
      const media = storySnapshot?.media ?? postSnapshot?.mediaItems ?? draft.mediaItems ?? (draft.media ? [draft.media] : []);
      const video = isStory ? storySnapshot?.mediaKind === "video" : draft.kind === "video";
      return <View key={draft.id} style={[styles.card, { padding: 13, gap: 8 }]}>
        <View style={styles.rowBetween}><Text style={styles.cardTitle}>{isStory ? "Social Story" : draft.kind[0].toUpperCase() + draft.kind.slice(1)} draft</Text><Text style={styles.caption}>{formatDate(draft.updatedAt)}</Text></View>
        <Text style={styles.body} numberOfLines={expanded ? undefined : 3}>{draft.caption || "No caption yet"}</Text>
        <Text style={styles.caption}>Identity · {identity} · {media.length ? `${media.length} media item${media.length === 1 ? "" : "s"}` : "Text only"}</Text>
        {expanded ? <View style={{ gap: 7, padding: 10, borderRadius: 13, backgroundColor: isStory ? storySnapshot?.background ?? colors.emeraldTint : colors.subtle }}><Text style={styles.caption}>Local draft preview · not published</Text>{media.map((uri, index) => video ? <VideoPreview key={`${uri}-${index}`} uri={uri} height={145} /> : <MediaImage key={`${uri}-${index}`} uri={uri} height={130} label={`Draft media ${index + 1}`} />)}{postSnapshot?.pollQuestion ? <Text style={styles.cardTitle}>Poll · {postSnapshot.pollQuestion}</Text> : null}{storySnapshot ? <Text style={styles.caption}>{storySnapshot.audience} audience · {storySnapshot.musicTrack}</Text> : null}</View> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}><Button title="Continue editing" icon="create-outline" small onPress={() => edit(draft)} /><Button title={expanded ? "Hide preview" : "Preview"} icon="eye-outline" small variant="soft" onPress={() => setPreviewId(expanded ? undefined : draft.id)} /><Button title="Duplicate" icon="copy-outline" small variant="outline" onPress={() => duplicate(draft)} /><Button title="Delete" icon="trash-outline" small variant="danger" onPress={() => setDeleteId(draft.id)} /></View>
      </View>;
    }) : <EmptyState title={query ? "No drafts match your search" : "No drafts saved"} detail={query ? "Try a shorter search or clear the query." : "Save or edit an unfinished post or Story to keep it here on this device."} icon="documents-outline" action={query ? "Clear search" : "Create content"} onAction={() => query ? setQuery("") : router.replace("/(tabs)/create")} />}
    <ConfirmModal visible={Boolean(deleteId)} title="Delete this local draft?" detail="This removes the draft and its settings from this device only. The source of any previously published post or Story is not affected." confirmLabel="Delete draft" destructive onCancel={() => setDeleteId(undefined)} onConfirm={remove} />
  </Page>;
}
