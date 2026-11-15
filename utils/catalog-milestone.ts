import type { Product, Service } from "@/types/domain";

/** Strict Gregorian YYYY-MM-DD check; rejects normalized dates such as February 30. */
export function isValidMilestoneDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Applies an edit without losing archive status or optional fields omitted by a partial form. */
export function updateCatalogItem<T extends Product | Service>(items: T[], id: string, patch: Partial<T>): T[] {
  return items.map((item) => item.id === id ? { ...item, ...patch, id: item.id, businessId: item.businessId, archived: patch.archived ?? item.archived } as T : item);
}
