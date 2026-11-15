export type MediaSelectionFailure = "permission" | "cancelled" | "unavailable";

export function classifyMediaSelectionFailure(error: unknown): MediaSelectionFailure {
  if (typeof error === "string" && /cancel/i.test(error)) return "cancelled";
  if (error && typeof error === "object") {
    const item = error as { code?: unknown; message?: unknown };
    const message = `${String(item.code ?? "")} ${String(item.message ?? "")}`.toLowerCase();
    if (/permission|denied|unauthorized/.test(message)) return "permission";
    if (/cancel/.test(message)) return "cancelled";
  }
  return "unavailable";
}

export function mediaSelectionFeedback(error: unknown, mediaLabel: "photo" | "video" | "media" = "media"): { title: string; message: string } | undefined {
  const kind = classifyMediaSelectionFailure(error);
  if (kind === "cancelled") return undefined;
  if (kind === "permission") return { title: "Permission needed", message: `Allow access to select a ${mediaLabel}. No file is uploaded in this demo.` };
  return { title: "Media selection unavailable", message: `Try selecting ${mediaLabel} on a device running Expo Go. You can continue without it; no media is sent to a server.` };
}
