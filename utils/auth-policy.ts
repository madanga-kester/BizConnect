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

export type DemoOnboardingStage = "idle" | "awaiting_otp" | "profile_setup";

export function resolveOnboardingRedirect(pathname: string, stage: DemoOnboardingStage): "/auth/profile-setup" | "/auth/register" | undefined {
  if (pathname === "/auth/otp" && stage === "profile_setup") return "/auth/profile-setup";
  if (pathname === "/auth/otp" && stage === "idle") return "/auth/register";
  if (pathname === "/auth/profile-setup" && stage !== "profile_setup") return "/auth/register";
  return undefined;
}
