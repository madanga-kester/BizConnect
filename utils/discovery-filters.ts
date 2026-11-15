import type { Business } from "@/types/domain";

export type DiscoverySort = "Recommended" | "A–Z business name" | "Highest rating" | "Most followed" | "Most popular" | "Recently registered";
export type PriceLevel = "Any price" | "KSh" | "KSh KSh" | "KSh KSh KSh";

export interface DiscoveryFilters {
  query?: string;
  category?: string;
  county?: string;
  town?: string;
  neighbourhood?: string;
  nearbyCounty?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  followedOnly?: boolean;
  priceLevel?: PriceLevel;
  sort?: DiscoverySort;
  followedBusinessIds?: readonly string[];
  blockedUserIds?: readonly string[];
}

function priceTier(priceRange: Business["priceRange"]): number {
  return priceRange === "KSh" ? 1 : priceRange === "KSh KSh" ? 2 : 3;
}

export function filterAndSortBusinesses(businesses: Business[], filters: DiscoveryFilters = {}): Business[] {
  const term = filters.query?.trim().toLocaleLowerCase() ?? "";
  const followed = new Set(filters.followedBusinessIds ?? []);
  const blocked = new Set(filters.blockedUserIds ?? []);
  const price = filters.priceLevel ?? "Any price";
  const items = businesses.filter((business) => {
    if (blocked.has(business.ownerId)) return false;
    const text = [business.name, business.category, business.subcategory, business.town, business.neighbourhood, business.county, business.description,
      ...business.products.flatMap((product) => [product.name, product.description, product.category]),
      ...business.services.flatMap((service) => [service.name, service.description, service.category])].join(" ").toLocaleLowerCase();
    if (term && !text.includes(term)) return false;
    if (filters.category && filters.category !== "All" && business.category !== filters.category && business.subcategory !== filters.category) return false;
    if (filters.county && filters.county !== "All counties" && business.county !== filters.county) return false;
    if (filters.town && filters.town !== "Any town" && business.town !== filters.town) return false;
    if (filters.neighbourhood && filters.neighbourhood !== "Any neighbourhood" && business.neighbourhood !== filters.neighbourhood) return false;
    if (filters.nearbyCounty && business.county !== filters.nearbyCounty) return false;
    if (filters.minRating && business.rating < filters.minRating) return false;
    if (filters.verifiedOnly && !business.verified) return false;
    if (filters.followedOnly && !followed.has(business.id)) return false;
    if (price !== "Any price" && priceTier(business.priceRange) !== price.split(" ").length) return false;
    return true;
  });

  switch (filters.sort ?? "Recommended") {
    case "A–Z business name": return items.sort((a, b) => a.name.localeCompare(b.name));
    case "Highest rating": return items.sort((a, b) => b.rating - a.rating || b.followers - a.followers);
    case "Most followed": return items.sort((a, b) => b.followers - a.followers);
    case "Most popular": return items.sort((a, b) => b.analytics.profileViews - a.analytics.profileViews || b.followers - a.followers);
    case "Recently registered": return items.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
    default: return items;
  }
}
