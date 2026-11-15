import { describe, expect, it } from "vitest";
import { createLocalSessionManager, isSessionExpiryValid } from "@/lib/auth/local-session";
import { isProtectedRoute } from "@/utils/auth-policy";

function createMemoryStore() {
  let value: string | null = null;
  return {
    store: {
      getItem: async () => value,
      setItem: async (next: string) => { value = next; },
      removeItem: async () => { value = null; },
    },
    getValue: () => value,
  };
}

describe("local session lifecycle and route protection", () => {
  it("opens, restores, expires and clears a demo session without storing credentials", async () => {
    let now = 1000;
    const memory = createMemoryStore();
    const session = createLocalSessionManager(memory.store, () => now, 50);
    expect(await session.isActive()).toBe(false);
    const expiry = await session.open();
    expect(memory.getValue()).toBe(expiry);
    expect(await session.isActive()).toBe(true);
    now = 1050;
    expect(await session.isActive()).toBe(false);
    await session.close();
    expect(memory.getValue()).toBeNull();
    expect(isSessionExpiryValid("not-a-date", now)).toBe(false);
  });

  it("protects personal/private management routes while allowing public browsing", () => {
    for (const route of ["messages", "notifications", "settings", "privacy", "create-business", "business-management", "saved", "data-export"]) {
      expect(isProtectedRoute([route])).toBe(true);
    }
    for (const route of [["(tabs)", "discover"], ["business", "b-tawi"], ["product", "p-1"], ["story", "s-1"], ["search"]]) {
      expect(isProtectedRoute(route)).toBe(false);
    }
  });
});
