import { describe, expect, it } from "vitest";
import { BUSINESSES } from "@/data/seed";
import { BUSINESS_MAP_LOCATIONS } from "@/data/business-map-locations";
import { getBusinessMapPins, getBusinessMapRegion, isValidMapCoordinate } from "@/utils/business-map";

describe("business map locations", () => {
  it("accepts only finite WGS84 coordinates", () => {
    expect(isValidMapCoordinate(BUSINESS_MAP_LOCATIONS["b-kivuli"])).toBe(true);
    expect(isValidMapCoordinate({ ...BUSINESS_MAP_LOCATIONS["b-kivuli"], latitude: 91 })).toBe(false);
    expect(isValidMapCoordinate({ ...BUSINESS_MAP_LOCATIONS["b-kivuli"], longitude: Number.NaN })).toBe(false);
    expect(isValidMapCoordinate(undefined)).toBe(false);
  });

  it("creates markers only for explicitly mapped businesses and excludes blocked owners", () => {
    const pins = getBusinessMapPins(BUSINESSES);
    expect(pins.length).toBeGreaterThan(0);
    expect(pins.every(({ location }) => location.source === "OpenStreetMap")).toBe(true);
    expect(pins.some(({ business }) => business.id === "b-greenridge")).toBe(false);

    const blockedOwner = pins[0]?.business.ownerId;
    expect(blockedOwner).toBeDefined();
    expect(getBusinessMapPins(BUSINESSES, [blockedOwner!]).some(({ business }) => business.ownerId === blockedOwner)).toBe(false);
  });

  it("keeps unmapped businesses discoverable instead of assigning invented pins", () => {
    const greenridge = BUSINESSES.find((business) => business.id === "b-greenridge");
    expect(greenridge).toBeDefined();
    expect(getBusinessMapPins([greenridge!])).toEqual([]);
  });

  it("computes a padded region from the filtered map points", () => {
    const pins = getBusinessMapPins(BUSINESSES.filter((business) => business.id === "b-kivuli"));
    expect(getBusinessMapRegion(pins)).toEqual({
      latitude: -1.2647561,
      longitude: 36.8018415,
      latitudeDelta: 0.22,
      longitudeDelta: 0.22,
    });
    expect(getBusinessMapRegion([])).toBeUndefined();
  });
});
