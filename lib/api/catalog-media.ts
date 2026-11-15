import type { CatalogMediaUploadInput } from "@/lib/api/feature-contracts";

/** React Native hands multipart parts to the native HTTP stack as a plain object, not as a Blob. */
export interface NativeFilePart {
  uri: string;
  name: string;
  type: string;
}

export type CatalogMediaRuntime = "web" | "native";

export interface CatalogUploadIssue {
  code: string;
  message: string;
}

/** The Stage 5 server accepts exactly these three image types. */
export const SUPPORTED_CATALOGUE_IMAGE_TYPES: readonly string[] = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_CATALOGUE_GALLERY_IMAGES = 12;
/**
 * Hard ceiling of the server's configurable 1-64 MiB upload limit. The authoritative cap is the
 * deployment's Storage:MaximumUploadMebibytes (default 10), which the server enforces and reports as
 * MEDIA_TOO_LARGE; pre-checking only at the ceiling avoids blocking a file a deployment would accept.
 */
export const MAX_CATALOGUE_IMAGE_BYTES = 64 * 1024 * 1024;

const DEVICE_URI_PATTERN = /^(file|content|blob|asset|ph|data):/i;

/** True for a path that only exists on this device (or in the preview sandbox). */
export function isDeviceFileUri(value?: string | null): boolean {
  if (!value) return false;
  return DEVICE_URI_PATTERN.test(value) || value.startsWith("/manus-storage/");
}

export function isSupportedCatalogueImage(contentType?: string | null): boolean {
  if (!contentType) return false;
  return SUPPORTED_CATALOGUE_IMAGE_TYPES.includes(contentType.trim().toLowerCase());
}

/** Client-side mirror of the server intake rules, so a doomed upload is explained with the server's own code. */
export function catalogUploadIssue(file: CatalogMediaUploadInput): CatalogUploadIssue | null {
  if (!file.uri?.trim()) return { code: "MEDIA_EMPTY", message: "Choose an image from this device before uploading." };
  if (!isSupportedCatalogueImage(file.contentType)) return { code: "MEDIA_TYPE_NOT_SUPPORTED", message: "Catalogue images must be JPEG, PNG or WebP." };
  if (file.sizeBytes !== undefined && file.sizeBytes > MAX_CATALOGUE_IMAGE_BYTES) return { code: "MEDIA_TOO_LARGE", message: "Catalogue images cannot exceed 64 MB. The server applies its own configured limit and will reject anything larger." };
  return null;
}

export function detectCatalogMediaRuntime(): CatalogMediaRuntime {
  return typeof document !== "undefined" && typeof window !== "undefined" ? "web" : "native";
}

function safeFileName(file: CatalogMediaUploadInput): string {
  const name = file.fileName?.trim();
  if (name) return name;
  const type = file.contentType?.toLowerCase();
  const extension = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return `catalogue-image.${extension}`;
}

/** The part shape the React Native FormData implementation expects. */
export function catalogNativeFilePart(file: CatalogMediaUploadInput): NativeFilePart {
  return { uri: file.uri, name: safeFileName(file), type: file.contentType || "image/jpeg" };
}

/**
 * Builds the `multipart/form-data` body for `POST /businesses/{businessId}/media`.
 * Web reads the picked object URL into a Blob; native appends the device part directly.
 */
export async function buildCatalogMediaForm(
  file: CatalogMediaUploadInput,
  runtime: CatalogMediaRuntime = detectCatalogMediaRuntime(),
  fetcher: typeof fetch = fetch,
): Promise<FormData> {
  const form = new FormData();
  if (runtime === "web") {
    const response = await fetcher(file.uri);
    if (!response.ok) throw new Error("The selected image could not be read from this device.");
    form.append("file", await response.blob(), safeFileName(file));
    return form;
  }
  form.append("file", catalogNativeFilePart(file) as unknown as Blob);
  return form;
}
