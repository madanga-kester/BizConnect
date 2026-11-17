import AsyncStorage from "@react-native-async-storage/async-storage";

export const ASSISTANT_HISTORY_KEY = "Mabiz.content-assistant.history.v1";

export const CONTENT_PURPOSES = [
  "Caption", "Rewrite", "Grammar check", "Professional tone", "More engaging", "Shorter", "Longer", "Change tone", "Hashtags", "Post title",
  "Business announcement", "Promotion", "Product description", "Service description", "Business update", "Event description", "Offer description",
  "Structure a rough idea", "Founder story", "Storytelling question", "Content topic", "Milestone description", "Poll question", "Educational post idea",
] as const;
export type ContentPurpose = (typeof CONTENT_PURPOSES)[number];
export const CONTENT_TYPES = ["Social post", "Business update", "Product or service", "Event or offer", "Founder story", "Poll or question", "Educational post"] as const;
export type AssistantContentType = (typeof CONTENT_TYPES)[number];
export const CONTENT_TONES = ["Warm", "Professional", "Friendly", "Confident", "Playful", "Informative", "Inspiring"] as const;
export type AssistantTone = (typeof CONTENT_TONES)[number];
export const CONTENT_LENGTHS = ["Short", "Medium", "Long"] as const;
export type AssistantLength = (typeof CONTENT_LENGTHS)[number];

export interface AssistantOptions {
  prompt: string;
  purpose: ContentPurpose;
  contentType: AssistantContentType;
  tone: AssistantTone;
  length: AssistantLength;
}
export interface AssistantHistoryEntry extends AssistantOptions {
  id: string;
  result: string;
  createdAt: string;
}

const safe = (value: string) => value.trim().replace(/\s+/g, " ");
const businessName = (prompt: string) => safe(prompt).replace(/[.!?].*$/, "").slice(0, 62) || "your business";

/** Local, deterministic demonstration copy only. This function never contacts an AI provider. */
export function createMockSuggestion(options: AssistantOptions): string {
  const prompt = safe(options.prompt);
  if (!prompt) throw new Error("Add a prompt or a few details before generating a suggestion.");
  const subject = businessName(prompt);
  const toneLead: Record<AssistantTone, string> = {
    Warm: "A little progress, a lot of heart.", Professional: "We are pleased to share an update.", Friendly: "Hello, neighbours! We have something to share.",
    Confident: "Good work deserves to be seen.", Playful: "Small business energy, coming right up!", Informative: "Here is a useful update from our team.", Inspiring: "Every big journey starts with one thoughtful step.",
  };
  const short = `${toneLead[options.tone]} ${prompt}`;
  const medium = `${toneLead[options.tone]}\n\n${prompt}\n\nWe are building this with our community in mind. If you are in Nairobi, Mombasa, Kisumu or nearby, tell us what you think — we would love to hear from you.`;
  const long = `${toneLead[options.tone]}\n\n${prompt}\n\nAt ${subject}, we believe good business grows through useful products, reliable service and genuine relationships. We are grateful to everyone supporting local businesses across Kenya.\n\nWhat would you like to see next? Share your thoughts below.`;
  const idea = `${toneLead[options.tone]}\n\n${prompt}\n\n• What inspired this?\n• Who does it help?\n• What is one practical next step?\n\nInvite your community to share their experience.`;
  const specialized: Partial<Record<ContentPurpose, string>> = {
    "Hashtags": `Suggested tags for ${subject}: #MadeInKenya #SupportLocalKE #KenyanBusiness #SmallBusinessKE`,
    "Post title": `${subject}: a local story worth sharing`,
    "Storytelling question": `What was one early challenge that taught you something important about ${subject}?`,
    "Content topic": `Share a behind-the-scenes look at ${subject}: one decision, lesson or customer moment that shaped the business.`,
    "Poll question": `What would you most like to see from ${subject}?\n• A behind-the-scenes story\n• A new product or service\n• A practical business tip\n• A community Q&A`,
    "Educational post idea": `Teach one practical lesson related to ${subject}. Use three simple steps, a Kenya-relevant example and one question for readers.`,
    "Milestone description": `A milestone worth celebrating: ${prompt}. Thank the customers, team and community who helped make this step possible.`,
    "Founder story": `${prompt}\n\nThe journey had its lessons, and each small step helped shape what came next. We are sharing this story to encourage another founder building in Kenya.`,
    "Grammar check": `${prompt}\n\nDemo note: this sample does not perform a real grammar analysis. Please review names, dates and facts before posting.`,
    "Shorter": `${prompt.slice(0, 115)}${prompt.length > 115 ? "…" : ""}`,
    "Longer": long,
    "Structure a rough idea": idea,
  };
  if (specialized[options.purpose]) return specialized[options.purpose]!;
  const detail = options.length === "Short" ? short : options.length === "Long" ? long : medium;
  if (options.purpose === "Rewrite" || options.purpose === "Change tone" || options.purpose === "Professional tone" || options.purpose === "More engaging") return detail;
  if (options.purpose === "Business announcement") return `${toneLead[options.tone]}\n\n${prompt}\n\nThank you for being part of our local business community. More details are coming soon.`;
  if (["Promotion", "Offer description"].includes(options.purpose)) return `${toneLead[options.tone]}\n\n${prompt}\n\nGet in touch for details and availability. Terms apply; please confirm dates and prices before sharing.`;
  if (options.purpose === "Product description" || options.purpose === "Service description") return `${subject}\n\n${prompt}\n\nMade for everyday needs, with thoughtful service from a local Kenyan business. Contact us to confirm availability, pricing and delivery or service area.`;
  if (options.purpose === "Event description") return `${prompt}\n\nJoin us to connect, learn and support local enterprise. Add the confirmed date, venue or online link, registration details and contact before publishing.`;
  if (options.purpose === "Business update") return `${toneLead[options.tone]}\n\n${prompt}\n\nWe appreciate your continued support and look forward to sharing the next step.`;
  return detail;
}

export function isAssistantHistoryEntry(value: unknown): value is AssistantHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.length > 0 && typeof item.result === "string" && item.result.trim().length > 0 &&
    typeof item.prompt === "string" && typeof item.purpose === "string" && (CONTENT_PURPOSES as readonly string[]).includes(item.purpose) &&
    typeof item.contentType === "string" && (CONTENT_TYPES as readonly string[]).includes(item.contentType) &&
    typeof item.tone === "string" && (CONTENT_TONES as readonly string[]).includes(item.tone) &&
    typeof item.length === "string" && (CONTENT_LENGTHS as readonly string[]).includes(item.length) &&
    typeof item.createdAt === "string" && Number.isFinite(Date.parse(item.createdAt));
}
export function parseAssistantHistory(raw: string | null): AssistantHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isAssistantHistoryEntry).slice(0, 50) : [];
  } catch { return []; }
}
export async function readAssistantHistory(): Promise<AssistantHistoryEntry[]> {
  return parseAssistantHistory(await AsyncStorage.getItem(ASSISTANT_HISTORY_KEY));
}
export async function saveAssistantHistory(entry: AssistantHistoryEntry): Promise<AssistantHistoryEntry[]> {
  if (!isAssistantHistoryEntry(entry)) throw new Error("Cannot save an invalid assistant history entry.");
  const current = await readAssistantHistory();
  const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 50);
  await AsyncStorage.setItem(ASSISTANT_HISTORY_KEY, JSON.stringify(next));
  return next;
}
export async function deleteAssistantHistoryEntry(id: string): Promise<AssistantHistoryEntry[]> {
  const next = (await readAssistantHistory()).filter((item) => item.id !== id);
  await AsyncStorage.setItem(ASSISTANT_HISTORY_KEY, JSON.stringify(next));
  return next;
}
export async function clearAssistantHistory(): Promise<void> {
  await AsyncStorage.removeItem(ASSISTANT_HISTORY_KEY);
}
