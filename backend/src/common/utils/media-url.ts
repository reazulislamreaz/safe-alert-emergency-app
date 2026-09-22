import { BadRequestException } from "@nestjs/common";
import {
  UPLOAD_MEDIA_MIME_TYPES,
  UPLOAD_MIME_TYPES,
  isStoredImageUrl,
} from "../../modules/uploads/uploads.constants";

/** Accept only URLs that look like our stored uploads (local or S3/CDN http). */
export function assertStoredMediaUrl(mediaUrl: string | undefined | null): string | undefined {
  if (!mediaUrl?.trim()) {
    return undefined;
  }
  const trimmed = mediaUrl.trim();
  if (trimmed.startsWith("data:")) {
    throw new BadRequestException("Data URLs are not allowed. Upload media via POST /api/uploads/media.");
  }
  if (trimmed.startsWith("/api/uploads/files/")) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new BadRequestException("Invalid media URL.");
    }
    // Reject obvious javascript: and non-http schemes already handled
    return trimmed;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException("Invalid media URL. Upload media via POST /api/uploads/media.");
  }
}

export function assertStoredImageOrThrow(url: string): void {
  if (!isStoredImageUrl(url)) {
    throw new BadRequestException("Upload images with POST /api/uploads/images.");
  }
}

export function isAllowedUploadMime(mime: string, allowVideo = false): boolean {
  const list = allowVideo ? UPLOAD_MEDIA_MIME_TYPES : UPLOAD_MIME_TYPES;
  return (list as readonly string[]).includes(mime.toLowerCase());
}
