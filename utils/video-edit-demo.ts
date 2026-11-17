import AsyncStorage from "@react-native-async-storage/async-storage";

export type VideoFilter = "none" | "warm" | "mono" | "vivid";
export type Subtitle = { id: string; text: string; startSeconds: number; endSeconds: number };
export type VideoEditState = {
  sourceUri: string;
  startSeconds: number;
  endSeconds: number;
  coverUri?: string;
  subtitles: Subtitle[];
  overlayText: string;
  overlayPosition: "top" | "center" | "bottom";
  filter: VideoFilter;
  qualityPreset?: "source" | "720p" | "1080p";
  updatedAt: string;
};
export type ProgressStatus = "idle" | "running" | "cancelled" | "error" | "complete";
export type ProgressDemo = { status: ProgressStatus; progress: number; attempt: number };
const PREFIX = "@Mabiz/video-edit/v1/";
const MAX_URI_LENGTH = 4096;

/** Accept only local or HTTPS media references (never javascript:, data: or arbitrary schemes). */
export function isSafeVideoUri(uri: string): boolean {
  if (!uri || uri.length > MAX_URI_LENGTH || /[\u0000-\u001f\s]/.test(uri)) return false;
  try {
    const parsed = new URL(uri);
    return parsed.protocol === "file:" || parsed.protocol === "content:" || parsed.protocol === "https:" || parsed.protocol === "asset:";
  } catch {
    return uri.startsWith("/") && !uri.startsWith("//");
  }
}
export function validateTrimRange(start: number, end: number, duration: number): string | null {
  if (![start, end, duration].every(Number.isFinite)) return "Enter valid numeric times.";
  if (duration <= 0) return "Video duration is not available yet.";
  if (start < 0 || end < 0) return "Trim times cannot be negative.";
  if (start >= end) return "End time must be after start time.";
  if (end > duration) return `End time must be within the ${duration.toFixed(1)} second source clip.`;
  return null;
}
export function transitionProgress(state: ProgressDemo, action: "start" | "tick" | "cancel" | "retry" | "fail"): ProgressDemo {
  switch (action) {
    case "start": return { status: "running", progress: 0, attempt: Math.max(1, state.attempt) };
    case "retry": return { status: "running", progress: 0, attempt: state.attempt + 1 };
    case "cancel": return state.status === "running" ? { ...state, status: "cancelled" } : state;
    case "fail": return state.status === "running" ? { ...state, status: "error" } : state;
    case "tick":
      if (state.status !== "running") return state;
      const progress = Math.min(100, state.progress + 20);
      return { ...state, progress, status: progress === 100 ? "complete" : "running" };
  }
}
function key(uri: string): string {
  if (!isSafeVideoUri(uri)) throw new Error("Unsafe video URI; edit session was not saved.");
  return PREFIX + encodeURIComponent(uri);
}
/** Read a device-only video edit plan previously saved for this source URI. */
export async function readVideoEdit(uri: string): Promise<VideoEditState | null> {
  try {
    const raw = await AsyncStorage.getItem(key(uri));
    if (!raw) return null;
    const value = JSON.parse(raw) as VideoEditState;
    return value.sourceUri === uri ? value : null;
  } catch {
    return null;
  }
}
/** Persist edit metadata only. This does not trim, transform, or upload the source bytes. */
export async function saveVideoEdit(uri: string, state: VideoEditState): Promise<void> {
  if (state.sourceUri !== uri) throw new Error("Edit source URI does not match storage key.");
  await AsyncStorage.setItem(key(uri), JSON.stringify(state));
}
/** Remove the device-only edit session for a source URI. */
export async function clearVideoEdit(uri: string): Promise<void> {
  await AsyncStorage.removeItem(key(uri));
}
