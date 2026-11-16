const PROTECTED_ROOT_SEGMENTS = new Set([
  "messages",
  "notifications",
  "settings",
  "privacy",
  "edit-profile",
  "create-business",
  "business-management",
  "catalog-management",
  "team",
  "analytics",
  "drafts",
  "search-history",
  "saved",
  "saved-businesses",
  "saved-opportunities",
  "recently-viewed",
  "data-export",
  "delete-account",
  "moderation-status",
]);

export function isProtectedRoute(segments: readonly string[]): boolean {
  const pageSegment = segments.find((segment) => !segment.startsWith("("));
  return Boolean(pageSegment && PROTECTED_ROOT_SEGMENTS.has(pageSegment));
}


