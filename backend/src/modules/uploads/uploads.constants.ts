import { BadRequestException } from "@nestjs/common";

export const UPLOAD_MAX_FILES = 3;
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const UPLOAD_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isStoredImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("data:")) {
    return false;
  }
  if (trimmed.startsWith("/api/uploads/files/")) {
    return true;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function requireStoredImageUrls(urls: string[] | undefined): string[] | undefined {
  if (urls === undefined) {
    return undefined;
  }
  const cleaned = urls.map((item) => item.trim()).filter(Boolean);
  for (const url of cleaned) {
    if (!isStoredImageUrl(url)) {
      throw new BadRequestException("Upload images with POST /api/uploads/images. Data URLs are not stored.");
    }
  }
  return cleaned;
}
