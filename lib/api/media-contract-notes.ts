import type { MediaFileInput, MediaUploadProgress, MediaUploadService, MediaUploadTicket } from "@/lib/api/feature-contracts";

/** A future API may issue tickets; local-demo screens never upload or report a completed remote asset. */
export type { MediaFileInput, MediaUploadProgress, MediaUploadService, MediaUploadTicket };

export interface MediaSelectionPolicy {
  maxImageWidth: number;
  imageCompression: number;
  videoAutoplayByDefault: false;
  retryableUploadContract: true;
}

export const mediaSelectionPolicy: MediaSelectionPolicy = {
  maxImageWidth: 1600,
  imageCompression: 0.72,
  videoAutoplayByDefault: false,
  retryableUploadContract: true,
};
