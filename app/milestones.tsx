import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Button, Chip, ConfirmModal, EmptyState, Field, LocalNote, MediaImage, Page, SectionTitle, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import type { Milestone } from "@/types/domain";
import { hasBusinessRole } from "@/utils/business-permissions";
import { newLocalId } from "@/utils/ids";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useThemeContext } from "@/lib/theme-provider";

function feedback(message: string) { if (Platform.OS === "web") window.alert(message); else Alert.alert("Milestone", message); }
const TYPES: { label: string; value: Milestone["kind"] }[] = [
  { label: "Business launch", value: "launch" }, { label: "First customer", value: "customer" }, { label: "First sale", value: "sale" },
  { label: "First employee", value: "employee" }, { label: "First location", value: "location" }, { label: "New branch", value: "branch" },
  { label: "Product launch", value: "product" }, { label: "Service launch", value: "service" }, { label: "Anniversary", value: "anniversary" },
  { label: "Partnership", value: "partnership" }, { label: "Expansion", value: "expansion" }, { label: "Achievement/target", value: "achievement" }, { label: "Custom", value: "custom" },
];
function validDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00.000Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }

export default function MilestonesScreen() {
  useThemeContext();
  const app = useAppStore();
  const { businessId, milestoneId } = useLocalSearchParams<{ businessId?: string; milestoneId?: string }>();
  const business = app.businesses.find((item) => item.id === businessId) ?? app.businesses.find((item) => item.id === app.activeBusinessId);
  const existing = business?.milestones.find((item) => item.id === milestoneId);
  const canManage = Boolean(business && app.isAuthenticated && hasBusinessRole(business, app.user.id));
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [kind, setKind] = useState<Milestone["kind"]>(existing?.kind ?? "achievement");
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10));
  const [mediaItems, setMediaItems] = useState<NonNullable<Milestone["mediaItems"]>>(existing?.mediaItems ?? (existing?.media ? [{ uri: existing.media, type: existing.mediaType ?? "image" }] : []));
  const [preview, setPreview] = useState(false);
  const [removeId, setRemoveId] = useState<string>();
  const [confirmSave, setConfirmSave] = useState(false);
  const snapshotKey = JSON.stringify({ businessId: business?.id, title, description, kind, date, mediaItems });
  const unsaved = useUnsavedChanges(snapshotKey);

  if (!business) return <Page><TopBar title="Business milestones" back /><EmptyState title="Business not found" detail="Choose a business profile to view its milestones." icon="trophy-outline" action="Discover businesses" onAction={() => router.push("/(tabs)/discover")} /></Page>;
  const verifyAccess = () => { const current = app.businesses.find((item) => item.id === business.id); return Boolean(app.isAuthenticated && current && hasBusinessRole(current, app.user.id)); };
  const save = (confirmed = false) => {
    if (!verifyAccess()) return feedback("Only this business's Owner or Administrator can manage milestones.");
    const current = app.businesses.find((item) => item.id === business.id);
    if (!current) return feedback("This business is no longer available.");
    if (!title.trim() || !description.trim()) return feedback("Add a milestone title and description.");
    if (!validDate(date)) return feedback("Enter a real calendar date in YYYY-MM-DD format.");
    const item: Milestone = { id: existing?.id ?? newLocalId("milestone"), businessId: current.id, title: title.trim(), description: description.trim(), date, media: mediaItems[0]?.uri, mediaType: mediaItems[0]?.type, mediaItems, kind };
    if (!confirmed) { setConfirmSave(true); return; }
    const milestones = existing ? current.milestones.map((milestone) => milestone.id === item.id ? item : milestone) : [...current.milestones, item];
    app.updateBusiness(current.id, { milestones: milestones.sort((a, b) => a.date.localeCompare(b.date)) });
    setConfirmSave(false);
    feedback(existing ? "Milestone updated on this device." : "Milestone saved to this business profile on this device.");
    if (!existing) { const today = new Date().toISOString().slice(0, 10); setTitle(""); setDescription(""); setMediaItems([]); setKind("achievement"); setDate(today); unsaved.markSaved(JSON.stringify({ businessId: business.id, title: "", description: "", kind: "achievement", date: today, mediaItems: [] })); }
    else unsaved.markSaved();
  };
  const remove = () => {
    if (!removeId || !verifyAccess()) { setRemoveId(undefined); return feedback("Your milestone permission changed; nothing was removed."); }
    app.updateBusiness(business.id, { milestones: business.milestones.filter((item) => item.id !== removeId) });
    setRemoveId(undefined);
  };
  const selectMedia = async (video = false) => {
    if (!verifyAccess()) return feedback("Only this business's Owner or Administrator can attach milestone media.");
    try {
      const Picker = await import("expo-image-picker");
      const permission = await Picker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return feedback("Allow media access to add a milestone image or video.");
      const result = await Picker.launchImageLibraryAsync({ mediaTypes: [video ? "videos" : "images"], allowsMultipleSelection: !video, selectionLimit: video ? 1 : 6, quality: 0.7, videoMaxDuration: 60 });
      if (result.canceled || !result.assets.length) return;
      const assets = result.assets.slice(0, video ? 1 : 6);
      if (assets.some((item) => item.fileSize !== undefined && item.fileSize > (video ? 100 : 12) * 1024 * 1024)) return feedback(video ? "Video must be 100 MB or less." : "Each photo must be 12 MB or less.");
      setMediaItems(assets.map((item) => ({ uri: item.uri, type: video ? "video" : "image" })));
    } catch { feedback("Media selection is available on a device. This demo does not upload files."); }
  };

  return <Page>
    <TopBar title="Business milestones" back />
    <LocalNote text={`Timeline for ${business.name} · locally stored and not publicly synced`} />
    <SectionTitle title="The journey so far" />
    {business.milestones.length ? business.milestones.map((item, index) => <View key={item.id} style={{ flexDirection: "row", gap: 11 }}><View style={{ width: 22, alignItems: "center" }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.orange, marginTop: 5 }} />{index < business.milestones.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 54, backgroundColor: colors.border }} /> : null}</View><View style={[styles.card, { flex: 1, padding: 13, gap: 6 }]}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.caption}>{item.date}</Text></View><Text style={styles.caption}>{TYPES.find((type) => type.value === item.kind)?.label ?? "Milestone"}</Text><Text style={styles.body}>{item.description}</Text>{(item.mediaItems?.length ? item.mediaItems : item.media ? [{ uri: item.media, type: item.mediaType ?? "image" }] : []).map((media, mediaIndex) => media.type === "video" ? <VideoPreview key={`${media.uri}-${mediaIndex}`} uri={media.uri} height={130} /> : <MediaImage key={`${media.uri}-${mediaIndex}`} uri={media.uri} height={125} label={`${item.title} media ${mediaIndex + 1}`} />)}{canManage ? <View style={styles.row}><Button title="Edit" icon="create-outline" small variant="outline" onPress={() => router.push({ pathname: "/milestones", params: { businessId: business.id, milestoneId: item.id } })} /><Button title="Delete" icon="trash-outline" small variant="danger" onPress={() => setRemoveId(item.id)} /></View> : null}</View></View>) : <Text style={styles.caption}>Document launches, first customers, new locations, products and other achievements as they happen.</Text>}
    {canManage ? <View style={[styles.card, { padding: 15, gap: 11 }]}><Text style={styles.sectionHeading}>{existing ? "Edit milestone" : "Add a milestone"}</Text><Text style={styles.label}>Milestone type</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{TYPES.map((item) => <Chip key={item.value} label={item.label} selected={kind === item.value} onPress={() => setKind(item.value)} />)}</View><Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2025-01-01" /><Field label="Title" value={title} onChangeText={setTitle} placeholder="A milestone worth remembering" /><Field label="Description" value={description} onChangeText={setDescription} placeholder="What changed for the business?" multiline /><View style={styles.row}><Button title="Choose photos" variant="outline" icon="images-outline" small onPress={() => void selectMedia(false)} /><Button title="Choose video" variant="outline" icon="videocam-outline" small onPress={() => void selectMedia(true)} />{mediaItems.length ? <Button title="Remove media" variant="quiet" small onPress={() => setMediaItems([])} /> : null}</View>{mediaItems.map((item, index) => item.type === "video" ? <VideoPreview key={`${item.uri}-${index}`} uri={item.uri} height={170} /> : <MediaImage key={`${item.uri}-${index}`} uri={item.uri} height={135} label={`Milestone image ${index + 1}`} />)}{preview ? <View style={[styles.card, { padding: 12 }]}><Text style={styles.cardTitle}>{title || "Milestone preview"}</Text><Text style={styles.caption}>{date} · {TYPES.find((item) => item.value === kind)?.label}</Text><Text style={styles.body}>{description}</Text></View> : null}<View style={styles.row}><Button title={preview ? "Hide preview" : "Preview"} icon="eye-outline" variant="outline" onPress={() => setPreview((value) => !value)} /><Button title={existing ? "Review changes" : "Review milestone"} onPress={() => save()} />{existing ? <Button title="Cancel edit" variant="quiet" onPress={() => router.replace({ pathname: "/milestones", params: { businessId: business.id } })} /> : null}</View></View> : <View style={{ gap: 8 }}><LocalNote text="Read-only timeline · only this business's Owner or Administrator can add, edit or remove milestones." />{!app.isAuthenticated ? <Button title="Sign in to manage a business you own" variant="outline" onPress={() => router.push("/auth/login")} /> : null}</View>}
    <ConfirmModal visible={confirmSave} title={`Save milestone ${existing ? "changes" : "locally"}?`} detail="This milestone is stored on this device in the selected business profile. Confirm the date, description and media preview; nothing is synced or shared." confirmLabel="Save locally" onCancel={() => setConfirmSave(false)} onConfirm={() => save(true)} />
    <ConfirmModal visible={unsaved.confirmVisible} title="Discard unsaved milestone changes?" detail="Leaving discards your current edits. An existing milestone remains unchanged." confirmLabel="Discard changes" destructive onCancel={unsaved.stay} onConfirm={unsaved.discardAndLeave} />
    <ConfirmModal visible={Boolean(removeId)} title="Delete this milestone?" detail="This removes the item from this business's timeline on this device only." confirmLabel="Delete milestone" destructive onCancel={() => setRemoveId(undefined)} onConfirm={remove} />
  </Page>;
}
