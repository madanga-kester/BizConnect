import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Button, Chip, ConfirmModal, EmptyState, Field, LocalNote, MediaImage, Page, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { colors } from "@/theme/tokens";
import { newLocalId } from "@/utils/ids";
import { clearVideoEdit, isSafeVideoUri, readVideoEdit, saveVideoEdit, transitionProgress, validateTrimRange, type ProgressDemo, type Subtitle, type VideoEditState, type VideoFilter } from "@/utils/video-edit-demo";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useThemeContext } from "@/lib/theme-provider";

function announce(title: string, message: string) { if (Platform.OS === "web") window.alert(`${title}\n\n${message}`); else Alert.alert(title, message); }
function parseFinite(value: string): number { return value.trim() === "" ? Number.NaN : Number(value); }
function validateSubtitles(items: Subtitle[], duration?: number): string | null {
  for (const item of items) {
    if (!item.text.trim()) return "Each subtitle needs text.";
    if (![item.startSeconds, item.endSeconds].every(Number.isFinite) || item.startSeconds < 0 || item.startSeconds >= item.endSeconds) return "Subtitle end times must be after start times.";
    if (duration !== undefined && item.endSeconds > duration) return "Subtitle timing must stay inside the source duration.";
  }
  return null;
}

export default function VideoEditorScreen() {
  useThemeContext();
  const { source, duration: durationParam } = useLocalSearchParams<{ source?: string; duration?: string }>();
  const uri = typeof source === "string" ? source : "";
  const parsedDuration = typeof durationParam === "string" ? Number(durationParam) : Number.NaN;
  const duration = Number.isFinite(parsedDuration) && parsedDuration > 0 && parsedDuration <= 3600 ? parsedDuration : undefined;
  const [startText, setStartText] = useState("0");
  const [endText, setEndText] = useState(duration === undefined ? "" : String(duration.toFixed(1)));
  const [coverUri, setCoverUri] = useState<string>();
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [overlayText, setOverlayText] = useState("");
  const [overlayPosition, setOverlayPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [filter, setFilter] = useState<VideoFilter>("none");
  const [qualityPreset, setQualityPreset] = useState<"source" | "720p" | "1080p">("source");
  const [progress, setProgress] = useState<ProgressDemo>({ status: "idle", progress: 0, attempt: 0 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const snapshotKey = JSON.stringify({ uri, startText, endText, coverUri, subtitles, overlayText, overlayPosition, filter, qualityPreset });
  const { markSaved, confirmVisible, discardAndLeave, stay } = useUnsavedChanges(snapshotKey);

  useEffect(() => {
    if (!isSafeVideoUri(uri)) return;
    let active = true;
    void readVideoEdit(uri).then((saved) => {
      if (!active || !saved) return;
      setStartText(String(saved.startSeconds)); setEndText(String(saved.endSeconds)); setCoverUri(saved.coverUri); setSubtitles(saved.subtitles); setOverlayText(saved.overlayText); setOverlayPosition(saved.overlayPosition); setFilter(saved.filter); setQualityPreset(saved.qualityPreset ?? "source");
      markSaved(JSON.stringify({ uri, startText: String(saved.startSeconds), endText: String(saved.endSeconds), coverUri: saved.coverUri, subtitles: saved.subtitles, overlayText: saved.overlayText, overlayPosition: saved.overlayPosition, filter: saved.filter, qualityPreset: saved.qualityPreset ?? "source" }));
    });
    return () => { active = false; };
  }, [uri, markSaved]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (!isSafeVideoUri(uri)) return <Page><TopBar title="Video editor" back /><EmptyState title="Choose a local video first" detail="Open the editor from a video selected in the Create composer. This route accepts only local or secure HTTPS media references." action="Back to Create" onAction={() => router.replace("/(tabs)/create")} /></Page>;

  const start = parseFinite(startText);
  const end = parseFinite(endText);
  const trimError = duration === undefined ? "Duration metadata was not provided by the picker. Select a clip with duration details to validate trim points." : validateTrimRange(start, end, duration);
  const runDemo = () => {
    if (trimError) { setError(trimError); return; }
    setError("");
    setProgress((current) => transitionProgress(current, current.status === "idle" ? "start" : "retry"));
    if (intervalRef.current) clearInterval(intervalRef.current);
    const timer = setInterval(() => setProgress((current) => {
      const next = transitionProgress(current, "tick");
      if (next.status === "complete") { clearInterval(timer); intervalRef.current = null; }
      return next;
    }), 240);
    intervalRef.current = timer;
  };
  const cancelDemo = () => { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = null; setProgress((current) => transitionProgress(current, "cancel")); };
  const pickCover = async () => {
    try {
      const Picker = await import("expo-image-picker");
      const permission = await Picker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { announce("Photo access needed", "Allow photo access to choose a cover image, or keep the source video thumbnail."); return; }
      const result = await Picker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9], quality: 0.75 });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.mimeType && !asset.mimeType.startsWith("image/")) { announce("Unsupported cover", "Choose an image file for the local cover preview."); return; }
        if (asset.fileSize !== undefined && asset.fileSize > 12 * 1024 * 1024) { announce("Cover too large", "Choose an image no larger than 12 MB."); return; }
        setCoverUri(asset.uri);
      }
    } catch { announce("Cover picker unavailable", "Keep the original video thumbnail. No upload was attempted."); }
  };
  const save = async () => {
    if (trimError) { setError(trimError); return; }
    const subtitleError = validateSubtitles(subtitles, duration);
    if (subtitleError) { setError(subtitleError); return; }
    const state: VideoEditState = { sourceUri: uri, startSeconds: start, endSeconds: end, coverUri, subtitles, overlayText: overlayText.trim(), overlayPosition, filter, qualityPreset, updatedAt: new Date().toISOString() };
    try { setBusy(true); await saveVideoEdit(uri, state); markSaved(); announce("Edit plan saved", "Trim points, cover and styling metadata are stored on this device only. The source video bytes were not edited, exported or uploaded."); router.back(); }
    catch { setError("Could not save this edit plan to local storage."); }
    finally { setBusy(false); }
  };
  const addSubtitle = () => setSubtitles((items) => items.length >= 12 ? items : [...items, { id: newLocalId("subtitle"), text: "", startSeconds: 0, endSeconds: Math.min(2, duration ?? 2) }]);

  return <Page>
    <TopBar title="Video editor" back />
    <LocalNote text="Local editing demonstration · source video remains unchanged · no export or upload occurs" />
    <VideoPreview uri={uri} height={255} />
    <View style={{ gap: 5 }}><Text style={styles.sectionHeading}>Trim range</Text><Text style={styles.caption}>{duration ? `Picker duration · ${duration.toFixed(1)} seconds` : "Duration unavailable"} · Original file size/codec is not reported by this screen.</Text></View>
    <View style={styles.row}><View style={{ flex: 1 }}><Field label="Start (seconds)" value={startText} onChangeText={setStartText} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="End (seconds)" value={endText} onChangeText={setEndText} keyboardType="decimal-pad" /></View></View>
    {trimError ? <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 12 }}>{trimError}</Text> : null}
    <View style={[styles.card, { padding: 13, gap: 8 }]}><Text style={styles.sectionHeading}>Cover image</Text>{coverUri ? <MediaImage uri={coverUri} height={150} label="Selected local video cover" /> : <Text style={styles.caption}>Use the player thumbnail or choose a local image for the edit plan.</Text>}<View style={styles.row}><Button title="Choose cover" icon="image-outline" small variant="outline" onPress={() => void pickCover()} />{coverUri ? <Button title="Remove cover" icon="close-outline" small variant="quiet" onPress={() => setCoverUri(undefined)} /> : null}</View></View>
    <Field label="Video text overlay" value={overlayText} onChangeText={setOverlayText} placeholder="Optional on-screen text" maxLength={180} />
    <Text style={styles.label}>Overlay position</Text><View style={styles.row}>{(["top", "center", "bottom"] as const).map((item) => <Chip key={item} label={item[0].toUpperCase() + item.slice(1)} selected={overlayPosition === item} onPress={() => setOverlayPosition(item)} />)}</View>
    <Text style={styles.label}>Filter metadata</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{(["none", "warm", "mono", "vivid"] as const).map((item) => <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />)}</View><Text style={styles.caption}>Filters are saved as a preference only; the preview and source pixels are not altered.</Text>
    <Text style={styles.label}>Subtitle segments · up to 12</Text>{subtitles.map((item, index) => <View key={item.id} style={[styles.card, { padding: 10, gap: 7 }]}><View style={styles.rowBetween}><Text style={styles.cardTitle}>Segment {index + 1}</Text><Button title="Remove" icon="trash-outline" small variant="quiet" onPress={() => setSubtitles((current) => current.filter((entry) => entry.id !== item.id))} /></View><Field label="Subtitle text" value={item.text} onChangeText={(text) => setSubtitles((current) => current.map((entry) => entry.id === item.id ? { ...entry, text } : entry))} maxLength={180} /><View style={styles.row}><View style={{ flex: 1 }}><Field label="Start seconds" value={String(item.startSeconds)} onChangeText={(value) => setSubtitles((current) => current.map((entry) => entry.id === item.id ? { ...entry, startSeconds: parseFinite(value) } : entry))} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="End seconds" value={String(item.endSeconds)} onChangeText={(value) => setSubtitles((current) => current.map((entry) => entry.id === item.id ? { ...entry, endSeconds: parseFinite(value) } : entry))} keyboardType="decimal-pad" /></View></View></View>)}<Button title="Add subtitle segment" icon="add-outline" variant="outline" small disabled={subtitles.length >= 12} onPress={addSubtitle} />
    <Text style={styles.label}>Demo export profile · metadata only</Text><View style={styles.row}>{(["source", "720p", "1080p"] as const).map((item) => <Chip key={item} label={item === "source" ? "Keep source" : item} selected={qualityPreset === item} onPress={() => setQualityPreset(item)} />)}</View><Text style={styles.caption}>No encoder is connected. This setting does not change resolution, bitrate, file size or codec.</Text>
    <View style={[styles.card, { padding: 13, gap: 8 }]}><View style={styles.rowBetween}><Text style={styles.sectionHeading}>Processing progress demo</Text><Text style={styles.caption}>{progress.attempt ? `Attempt ${progress.attempt}` : "No job"}</Text></View><View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress.progress }} style={{ height: 8, borderRadius: 8, backgroundColor: colors.border, overflow: "hidden" }}><View style={{ height: 8, width: `${progress.progress}%`, backgroundColor: colors.emerald }} /></View><Text style={styles.caption}>{progress.status === "complete" ? "Demonstration complete; no file was transformed." : progress.status === "cancelled" ? "Demonstration cancelled; the source remains unchanged." : progress.status === "running" ? `${progress.progress}% · simulated local progress` : progress.status === "error" ? "Simulated failure; retry is available." : "A simulated progress indicator; it does not process video bytes."}</Text>{error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}<View style={styles.row}>{progress.status === "running" ? <Button title="Cancel demo" icon="close-circle-outline" small variant="danger" onPress={cancelDemo} /> : <Button title={progress.status === "error" || progress.status === "cancelled" ? "Retry demo" : "Run progress demo"} icon="play-outline" small variant="soft" onPress={runDemo} />}{progress.status === "complete" ? <Button title="Clear local edit" icon="trash-outline" small variant="quiet" onPress={() => { void clearVideoEdit(uri).then(() => announce("Cleared", "The device-only edit plan was removed.")); }} /> : null}</View></View>
    <Button title={busy ? "Saving…" : "Save edit metadata"} icon="save-outline" disabled={busy || Boolean(trimError)} onPress={() => void save()} />
    <Button title="Cancel editing" variant="quiet" onPress={() => router.back()} />
    <ConfirmModal visible={confirmVisible} title="Discard this edit session?" detail="Unsaved trim, cover and styling metadata will be dropped. The original video is never changed." confirmLabel="Discard edit" destructive onCancel={stay} onConfirm={discardAndLeave} />
  </Page>;
}
