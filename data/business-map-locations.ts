/**
 * Public area markers derived from OpenStreetMap place features returned by Photon.
 * These identify neighbourhood/city areas, never a business storefront or private residence.
 * Coordinates are intentionally omitted for areas without a matching public area feature.
 */
export interface BusinessMapLocation {
  latitude: number;
  longitude: number;
  areaName: string;
  granularity: "neighbourhood" | "district" | "city";
  source: "OpenStreetMap";
  osmType: "N" | "R" | "W";
  osmId: string;
}

export const BUSINESS_MAP_LOCATIONS: Readonly<Record<string, BusinessMapLocation>> = {
  "b-kivuli": {
    latitude: -1.2647561,
    longitude: 36.8018415,
    areaName: "Westlands",
    granularity: "neighbourhood",
    source: "OpenStreetMap",
    osmType: "N",
    osmId: "30121815",
  },
  "b-bahari": {
    latitude: -4.0465321,
    longitude: 39.7035201,
    areaName: "Nyali",
    granularity: "district",
    source: "OpenStreetMap",
    osmType: "N",
    osmId: "2249896631",
  },
  "b-asili": {
    latitude: -0.1146589,
    longitude: 34.7524675,
    areaName: "Milimani",
    granularity: "neighbourhood",
    source: "OpenStreetMap",
    osmType: "N",
    osmId: "10591514863",
  },
  "b-mbao": {
    latitude: -0.2860967,
    longitude: 36.0932959,
    areaName: "Section 58, Nakuru",
    granularity: "city",
    source: "OpenStreetMap",
    osmType: "N",
    osmId: "9433066508",
  },
  "b-tawi": {
    latitude: -1.2829946,
    longitude: 36.8015555,
    areaName: "Kilimani",
    granularity: "neighbourhood",
    source: "OpenStreetMap",
    osmType: "R",
    osmId: "16375650",
  },
  "b-jikoni": {
    latitude: -1.3087022,
    longitude: 36.8230975,
    areaName: "Nairobi West",
    granularity: "neighbourhood",
    source: "OpenStreetMap",
    osmType: "N",
    osmId: "544377108",
  },
  "b-nia": {
    latitude: -1.2829946,
    longitude: 36.8015555,
    areaName: "Kilimani",
    granularity: "neighbourhood",
    source: "OpenStreetMap",
    osmType: "R",
    osmId: "16375650",
  },
};
