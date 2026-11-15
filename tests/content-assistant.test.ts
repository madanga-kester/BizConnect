import { describe, expect, it } from "vitest";
import { createMockSuggestion, isAssistantHistoryEntry, parseAssistantHistory, type AssistantHistoryEntry, type AssistantOptions } from "@/lib/services/mock-content-assistant";

const options: AssistantOptions = { prompt: "Launching handmade bags in Nairobi", purpose: "Caption", contentType: "Social post", tone: "Warm", length: "Medium" };

describe("local writing assistant", () => {
  it("uses deterministic Kenyan-context templates and does not vary across calls", () => {
    const first = createMockSuggestion(options);
    expect(createMockSuggestion(options)).toBe(first);
    expect(first).toContain("Nairobi");
    expect(first).toContain("community");
  });
  it("rejects empty prompts and provides purpose-specific examples", () => {
    expect(() => createMockSuggestion({ ...options, prompt: "  " })).toThrow("Add a prompt");
    expect(createMockSuggestion({ ...options, purpose: "Hashtags" })).toContain("#MadeInKenya");
    expect(createMockSuggestion({ ...options, purpose: "Grammar check" })).toContain("does not perform a real grammar analysis");
  });
  it("validates and bounds local history instead of trusting persisted data", () => {
    const entry: AssistantHistoryEntry = { ...options, id: "a-1", result: "A sample caption", createdAt: "2026-01-10T10:00:00.000Z" };
    expect(isAssistantHistoryEntry(entry)).toBe(true);
    expect(isAssistantHistoryEntry({ ...entry, purpose: "Not a supported purpose" })).toBe(false);
    expect(parseAssistantHistory("not-json")).toEqual([]);
    expect(parseAssistantHistory(JSON.stringify([entry, { nope: true }]))).toEqual([entry]);
  });
});
