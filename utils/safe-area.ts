type TopInsetInput = {
  platform: string;
  topInset: number;
  viewportWidth: number;
  embeddedPreview: boolean;
};

const DYNAMIC_ISLAND_FALLBACK = 59;
const PLACEHOLDER_INSET_MAX = 16;
const PHONE_PREVIEW_MAX_WIDTH = 500;

export function resolveTopContentInset({ platform, topInset, viewportWidth, embeddedPreview }: TopInsetInput): number {
  if (topInset > PLACEHOLDER_INSET_MAX) return topInset;
  const nativeIPhone = platform === "ios";
  const narrowEmbeddedPhonePreview = platform === "web" && embeddedPreview && viewportWidth <= PHONE_PREVIEW_MAX_WIDTH;
  return nativeIPhone || narrowEmbeddedPhonePreview ? DYNAMIC_ISLAND_FALLBACK : topInset;
}
