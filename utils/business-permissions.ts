import type { Business, TeamRole } from "@/types/domain";

export const OWNER_ADMIN_ROLES: readonly TeamRole[] = ["Owner", "Administrator"];
export const BUSINESS_CONTENT_ROLES: readonly TeamRole[] = ["Owner", "Administrator", "Content Manager"];

export function getBusinessRole(business: Business, userId: string): TeamRole | undefined {
  if (business.ownerId === userId) return "Owner";
  return business.team.find((member) => member.userId === userId)?.role;
}

export function hasBusinessRole(
  business: Business,
  userId: string,
  allowedRoles: readonly TeamRole[] = OWNER_ADMIN_ROLES,
): boolean {
  const role = getBusinessRole(business, userId);
  return role !== undefined && allowedRoles.includes(role);
}
