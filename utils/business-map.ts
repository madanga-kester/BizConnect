import type { Business } from "@/types/domain";
import { BUSINESS_MAP_LOCATIONS, type BusinessMapLocation } from "@/data/business-map-locations";

export interface BusinessMapPin {
  business: Business;
  location: BusinessMapLocation;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export function isValidMapCoordinate(location: BusinessMapLocation | undefined): location is BusinessMapLocation {
  return Boolean(
    location &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude) &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180,
  );
}

/** Only businesses with an explicit, source-attributed area feature become map pins. */
export function getBusinessMapPins(businesses: readonly Business[], blockedUserIds: readonly string[] = []): BusinessMapPin[] {
  return businesses.flatMap((business) => {
    const location = BUSINESS_MAP_LOCATIONS[business.id];
    if (blockedUserIds.includes(business.ownerId) || !isValidMapCoordinate(location)) return [];
    return [{ business, location }];
  });
}

/** Fit the map to supplied approximate area markers, with a little breathing room. */
export function getBusinessMapRegion(pins: readonly BusinessMapPin[]): MapRegion | undefined {
  if (!pins.length) return undefined;
  const latitudes = pins.map(({ location }) => location.latitude);
  const longitudes = pins.map(({ location }) => location.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max(0.22, (maxLatitude - minLatitude) * 1.35),
    longitudeDelta: Math.max(0.22, (maxLongitude - minLongitude) * 1.35),
  };
}
