import { describe, expect, it } from "vitest";
import { createLocalSessionManager } from "@/lib/auth/local-session";

describe("local demo session logout", () => {
  it("opens, expires and clears the device-local session credential", async () => {
    let stored: string | null = null;
    let now = 1_000;
    const session = createLocalSessionManager({
      getItem: async () => stored,
      setItem: async (value) => { stored = value; },
      removeItem: async () => { stored = null; },
    }, () => now, 500);

    expect(await session.isActive()).toBe(false);
    expect(await session.open()).toBe("1500");
    expect(await session.isActive()).toBe(true);
    now = 1_501;
    expect(await session.isActive()).toBe(false);
    await session.close();
    expect(stored).toBeNull();
    expect(await session.isActive()).toBe(false);
  });

  it("rejects empty, malformed and already-expired session credentials", async () => {
    let stored: string | null = "not-a-timestamp";
    const session = createLocalSessionManager({
      getItem: async () => stored,
      setItem: async (value) => { stored = value; },
      removeItem: async () => { stored = null; },
    }, () => 10_000, 500);

    expect(await session.isActive()).toBe(false);
    stored = "10000";
    expect(await session.isActive()).toBe(false);
    stored = null;
    expect(await session.isActive()).toBe(false);
  });
});
