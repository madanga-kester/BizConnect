import { describe, expect, it } from "vitest";
import { canAutoplayVideo, resolveActiveVideoId } from "@/utils/video-playback";

describe("video playback policy", () => {
  it("only autoplays the active item when autoplay is enabled and data saving is off", () => {
    expect(canAutoplayVideo(true, true, false)).toBe(true);
    expect(canAutoplayVideo(false, true, false)).toBe(false);
    expect(canAutoplayVideo(true, false, false)).toBe(false);
    expect(canAutoplayVideo(true, true, true)).toBe(false);
  });

  it("does not select an active video until a current list item is reported visible", () => {
    const items = [{ id: "clip-1" }, { id: "clip-2" }];
    expect(resolveActiveVideoId(items, null)).toBeNull();
    expect(resolveActiveVideoId(items, "removed-clip")).toBeNull();
    expect(resolveActiveVideoId(items, "clip-2")).toBe("clip-2");
  });
});
