import { describe, expect, it } from "vitest";
import { isSafeVideoUri, transitionProgress, validateTrimRange, type ProgressDemo } from "@/utils/video-edit-demo";

const idle: ProgressDemo = { status: "idle", progress: 0, attempt: 0 };

describe("local video edit demonstration", () => {
  it("accepts only local, asset or HTTPS source references", () => {
    expect(isSafeVideoUri("file:///tmp/clip.mp4")).toBe(true);
    expect(isSafeVideoUri("content://media/video/1")).toBe(true);
    expect(isSafeVideoUri("https://cdn.example.ke/clip.mp4")).toBe(true);
    expect(isSafeVideoUri("javascript:alert(1)")).toBe(false);
    expect(isSafeVideoUri("data:video/mp4;base64,abc")).toBe(false);
    expect(isSafeVideoUri("//evil.example/clip.mp4")).toBe(false);
  });
  it("rejects invalid, negative, empty and beyond-duration trim windows", () => {
    expect(validateTrimRange(0, 10, 30)).toBeNull();
    expect(validateTrimRange(10, 10, 30)).toContain("after");
    expect(validateTrimRange(-1, 4, 30)).toContain("negative");
    expect(validateTrimRange(0, 31, 30)).toContain("within");
    expect(validateTrimRange(Number.NaN, 10, 30)).toContain("numeric");
    expect(validateTrimRange(0, 1, 0)).toContain("not available");
  });
  it("transitions a cancellable demonstration job and supports retry", () => {
    const running = transitionProgress(idle, "start");
    expect(running).toMatchObject({ status: "running", progress: 0, attempt: 1 });
    const cancelled = transitionProgress(running, "cancel");
    expect(cancelled.status).toBe("cancelled");
    const retry = transitionProgress(cancelled, "retry");
    expect(retry).toMatchObject({ status: "running", progress: 0, attempt: 2 });
    expect(transitionProgress(retry, "tick")).toMatchObject({ status: "running", progress: 20 });
  });
  it("rejects invalid input for an async result without mutating idle state", () => {
    expect(transitionProgress(idle, "tick")).toEqual(idle);
    expect(transitionProgress(idle, "cancel")).toEqual(idle);
    expect(transitionProgress(idle, "fail")).toEqual(idle);
  });
});
