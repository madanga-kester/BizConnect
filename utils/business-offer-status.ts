import type { BusinessOffer } from "@/types/domain";

export function isBusinessOfferDateRangeValid(startsAt: string, expiresAt: string, now = Date.now()): boolean {
  const starts = Date.parse(startsAt);
  const expires = Date.parse(expiresAt);
  return Number.isFinite(starts) && Number.isFinite(expires) && expires > starts && expires > now;
}

export function getBusinessOfferStatus(startsAt: string, expiresAt: string, now = Date.now()): BusinessOffer["status"] {
  const starts = Date.parse(startsAt);
  const expires = Date.parse(expiresAt);
  if (!Number.isFinite(starts) || !Number.isFinite(expires) || expires <= now) return "expired";
  return starts > now ? "scheduled" : "active";
}
