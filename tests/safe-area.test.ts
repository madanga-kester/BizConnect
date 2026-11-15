import { describe, expect, it } from "vitest";
import { resolveTopContentInset } from "@/utils/safe-area";

describe("safe-area top inset", () => {
  it("uses a Dynamic Island fallback when native iOS reports the root placeholder", () => {
    expect(resolveTopContentInset({ platform: "ios", topInset: 16, viewportWidth: 390, embeddedPreview: false })).toBe(59);
  });

  it("uses the fallback in narrow embedded phone previews when Web insets are only a placeholder", () => {
    expect(resolveTopContentInset({ platform: "web", topInset: 16, viewportWidth: 390, embeddedPreview: true })).toBe(59);
  });

  it("preserves actual larger safe-area values", () => {
    expect(resolveTopContentInset({ platform: "ios", topInset: 62, viewportWidth: 390, embeddedPreview: false })).toBe(62);
  });

  it("does not add notch spacing to desktop Web or Android", () => {
    expect(resolveTopContentInset({ platform: "web", topInset: 16, viewportWidth: 1024, embeddedPreview: true })).toBe(16);
    expect(resolveTopContentInset({ platform: "web", topInset: 16, viewportWidth: 390, embeddedPreview: false })).toBe(16);
    expect(resolveTopContentInset({ platform: "android", topInset: 16, viewportWidth: 390, embeddedPreview: false })).toBe(16);
  });
});
