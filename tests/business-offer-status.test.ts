import { describe, expect, it } from "vitest";
import { getBusinessOfferStatus, isBusinessOfferDateRangeValid } from "@/utils/business-offer-status";

describe("business offer date/status policy", () => {
  const now = Date.parse("2026-11-12T12:00:00.000Z");

  it("rejects invalid, reversed, and already-expired date ranges", () => {
    expect(isBusinessOfferDateRangeValid("invalid", "2026-11-13T12:00:00.000Z", now)).toBe(false);
    expect(isBusinessOfferDateRangeValid("2026-11-14T12:00:00.000Z", "2026-11-13T12:00:00.000Z", now)).toBe(false);
    expect(isBusinessOfferDateRangeValid("2026-11-10T12:00:00.000Z", "2026-11-11T12:00:00.000Z", now)).toBe(false);
  });

  it("derives scheduled, active, and expired states from both dates", () => {
    expect(getBusinessOfferStatus("2026-11-13T12:00:00.000Z", "2026-11-14T12:00:00.000Z", now)).toBe("scheduled");
    expect(getBusinessOfferStatus("2026-11-11T12:00:00.000Z", "2026-11-13T12:00:00.000Z", now)).toBe("active");
    expect(getBusinessOfferStatus("2026-11-10T12:00:00.000Z", "2026-11-11T12:00:00.000Z", now)).toBe("expired");
  });
});
