import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Text, View } from "react-native";
import { Button, Chip, ConfirmModal, EmptyState, Field, LocalNote, Page, TopBar, styles } from "@/components/biz-ui";
import { CONTENT_LENGTHS, CONTENT_PURPOSES, CONTENT_TONES, CONTENT_TYPES, createMockSuggestion, deleteAssistantHistoryEntry, readAssistantHistory, saveAssistantHistory, type AssistantHistoryEntry, type AssistantLength, type AssistantTone, type AssistantContentType, type ContentPurpose } from "@/lib/services/mock-content-assistant";
import { colors } from "@/theme/tokens";
import { newLocalId } from "@/utils/ids";
import { useThemeContext } from "@/lib/theme-provider";

function announce(message: string) { if (Platform.OS === "web") window.alert(message); else Alert.alert("Writing assistant", message); }
function routeKind(contentType: AssistantContentType, purpose: ContentPurpose): string {
  if (purpose === "Poll question") return "poll";
  if (purpose === "Storytelling question" || contentType === "Founder story") return "story";
  if (contentType === "Business update") return "announcement";
  if (contentType === "Product or service") return "product";
  if (contentType === "Event or offer") return "promotion";
  if (contentType === "Educational post") return "education";
  return "text";
}

export default function CreateAssistantScreen() {
  useThemeContext();
  const { initial, kind: initialKind } = useLocalSearchParams<{ initial?: string; kind?: string }>();
  const [prompt, setPrompt] = useState(typeof initial === "string" ? initial : "");
  const [purpose, setPurpose] = useState<ContentPurpose>("Caption");
  const [contentType, setContentType] = useState<AssistantContentType>(initialKind === "story" ? "Founder story" : initialKind === "poll" ? "Poll or question" : "Social post");
  const [tone, setTone] = useState<AssistantTone>("Warm");
  const [length, setLength] = useState<AssistantLength>("Medium");
  const [suggestion, setSuggestion] = useState("");
  const [history, setHistory] = useState<AssistantHistoryEntry[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => { let active = true; void readAssistantHistory().then((records) => { if (active) setHistory(records); }).catch(() => { if (active) setError("Local history could not be read. You can still create a demonstration suggestion."); }); return () => { active = false; }; }, []);

  const generate = async () => {
    setError("");
    try {
      setBusy(true);
      await new Promise((resolve) => setTimeout(resolve, 220));
      const result = createMockSuggestion({ prompt, purpose, contentType, tone, length });
      setSuggestion(result);
      const entry: AssistantHistoryEntry = { id: newLocalId("assistant"), prompt: prompt.trim(), purpose, contentType, tone, length, result, createdAt: new Date().toISOString() };
      setHistory(await saveAssistantHistory(entry));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The local suggestion could not be generated.");
    } finally { setBusy(false); }
  };

  const copy = async (value: string) => {
    try { await Clipboard.setStringAsync(value); announce("Copied on this device. No content was uploaded."); }
    catch { announce("Clipboard is unavailable on this device. Select and copy the text manually."); }
  };

  const removeHistory = async (id: string) => {
    try { setHistory(await deleteAssistantHistoryEntry(id)); }
    catch { setError("The selected history item could not be removed from local storage."); }
  };

  return <Page>
    <TopBar title="Writing assistant" back />
    <LocalNote text="Deterministic writing demonstration · not an AI model · no prompt is sent anywhere" />
    <View style={{ padding: 15, borderRadius: 18, backgroundColor: colors.navy, gap: 7 }}><View style={styles.row}><Ionicons name="sparkles-outline" size={17} color={colors.orange} /><Text style={{ color: colors.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>LOCAL WRITING TOOL</Text></View><Text style={{ color: colors.white, fontSize: 21, fontWeight: "800" }}>Start with your real details.</Text><Text style={{ color: "#D9E2E9", lineHeight: 19 }}>Examples use fixed templates. Check every fact, date, price and claim before you publish.</Text></View>
    <Field label="Your notes or rough idea" value={prompt} onChangeText={setPrompt} placeholder="What are you sharing? Include only details you have verified." multiline maxLength={1000} />
    <Text style={styles.label}>Purpose</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{CONTENT_PURPOSES.map((item) => <Chip key={item} label={item} selected={purpose === item} onPress={() => setPurpose(item)} />)}</View>
    <Text style={styles.label}>Content type</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{CONTENT_TYPES.map((item) => <Chip key={item} label={item} selected={contentType === item} onPress={() => setContentType(item)} />)}</View>
    <Text style={styles.label}>Tone</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{CONTENT_TONES.map((item) => <Chip key={item} label={item} selected={tone === item} onPress={() => setTone(item)} />)}</View>
    <Text style={styles.label}>Length</Text><View style={{ flexDirection: "row", gap: 7 }}>{CONTENT_LENGTHS.map((item) => <Chip key={item} label={item} selected={length === item} onPress={() => setLength(item)} />)}</View>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
    <Button title={busy ? "Preparing local example…" : suggestion ? "Regenerate example" : "Generate example"} icon="sparkles-outline" disabled={busy || !prompt.trim()} onPress={() => void generate()} />
    {busy ? <View style={styles.row} accessibilityLiveRegion="polite"><ActivityIndicator color={colors.emerald} /><Text style={styles.caption}>Preparing a deterministic example on this device…</Text></View> : null}
    {suggestion ? <View style={[styles.card, { padding: 14, gap: 9 }]}><Text style={styles.sectionHeading}>Demonstration suggestion</Text><Field label="Edit generated example" value={suggestion} onChangeText={setSuggestion} multiline maxLength={5000} /><LocalNote text="Template-generated sample · review before use · not checked by an AI or fact-checker" /><View style={styles.row}><Button title="Copy text" icon="copy-outline" small variant="outline" onPress={() => void copy(suggestion)} /><Button title="Insert into composer" icon="create-outline" small onPress={() => router.replace({ pathname: "/create", params: { assistCaption: suggestion, assistKind: routeKind(contentType, purpose) } })} /></View></View> : null}
    <View style={[styles.rowBetween, { marginTop: 5 }]}><Text style={styles.sectionHeading}>Recent local examples</Text>{history.length ? <Button title="Clear history" icon="trash-outline" small variant="quiet" onPress={() => setConfirmClear(true)} /> : null}</View>
    {history.map((entry) => <View key={entry.id} style={[styles.card, { padding: 12, gap: 7 }]}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{entry.purpose} · {entry.contentType}</Text><Text style={styles.caption}>{new Date(entry.createdAt).toLocaleDateString("en-KE")}</Text></View><Text style={styles.body} numberOfLines={4}>{entry.result}</Text><View style={styles.row}><Button title="Use" icon="create-outline" small variant="soft" onPress={() => router.replace({ pathname: "/create", params: { assistCaption: entry.result, assistKind: routeKind(entry.contentType, entry.purpose) } })} /><Button title="Copy" icon="copy-outline" small variant="outline" onPress={() => void copy(entry.result)} /><Button title="Remove" icon="trash-outline" small variant="quiet" onPress={() => void removeHistory(entry.id)} /></View></View>)}
    {!history.length ? <EmptyState title="No saved examples" detail="Generated samples appear here on this device. They are not conversations and are not sent to an AI provider." icon="document-text-outline" /> : null}
    <ConfirmModal visible={confirmClear} title="Clear local writing history?" detail="This removes saved example text from this device only." confirmLabel="Clear local history" destructive onCancel={() => setConfirmClear(false)} onConfirm={() => { setConfirmClear(false); void (async () => { for (const item of history) await removeHistory(item.id); })(); }} />
  </Page>;
}
