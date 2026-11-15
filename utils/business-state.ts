import type { Business, TeamRole } from "@/types/domain";
import { BUSINESS_CONTENT_ROLES, OWNER_ADMIN_ROLES, hasBusinessRole } from "@/utils/business-permissions";

export function resolveManagedBusinessIdentity(businesses: Business[], userId: string, requestedId?: string): string | undefined {
  if (!requestedId) return undefined;
  const business = businesses.find((item) => item.id === requestedId);
  return business && hasBusinessRole(business, userId, BUSINESS_CONTENT_ROLES) ? business.id : undefined;
}

export function resolveAccessibleBusinessIdentity(businesses: Business[], userId: string, requestedId?: string): string | undefined {
  if (!requestedId) return undefined;
  const business = businesses.find((item) => item.id === requestedId);
  const roles: readonly TeamRole[] = ["Owner", "Administrator", "Content Manager", "Viewer"];
  return business && hasBusinessRole(business, userId, roles) ? business.id : undefined;
}

export function createOwnedBusinessRecord(businesses: Business[], business: Business, userId: string, authenticated: boolean): { businesses: Business[]; changed: boolean } {
  if (!authenticated || business.ownerId !== userId || !business.team.some((member) => member.userId === userId && member.role === "Owner")) {
    return { businesses, changed: false };
  }
  if (businesses.some((item) => item.id === business.id)) return { businesses, changed: false };
  return { businesses: [business, ...businesses], changed: true };
}

export function updateBusinessRecord(
  businesses: Business[],
  id: string,
  patch: Partial<Business>,
  userId: string,
  allowedRoles: readonly TeamRole[] = OWNER_ADMIN_ROLES,
): { businesses: Business[]; changed: boolean } {
  const current = businesses.find((item) => item.id === id);
  if (!current || !hasBusinessRole(current, userId, allowedRoles)) return { businesses, changed: false };
  const updated = { ...current, ...patch, id: current.id, ownerId: current.ownerId };
  return { businesses: businesses.map((item) => item.id === id ? updated : item), changed: true };
}
