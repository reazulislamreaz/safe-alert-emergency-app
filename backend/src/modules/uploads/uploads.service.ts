import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { env } from "../../config/env";
import {
  UPLOAD_EXTENSIONS,
  UPLOAD_MAX_BYTES,
  UPLOAD_MAX_FILES,
  UPLOAD_MIME_TYPES,
} from "./uploads.constants";

export type StoredImage = {
  key: string;
  url: string;
  contentType: string;
  size: number;
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly s3?: S3Client;
  readonly localDir = join(process.cwd(), "uploads");

  constructor() {
    if (env.s3.bucket) {
      this.s3 = new S3Client({
        region: env.s3.region,
        ...(env.s3.accessKeyId && env.s3.secretAccessKey
          ? {
              credentials: {
                accessKeyId: env.s3.accessKeyId,
                secretAccessKey: env.s3.secretAccessKey,
              },
            }
          : {}),
      });
    } else {
      this.logger.warn("AWS_S3_BUCKET is unset — storing images on local disk for development.");
    }
  }

  usesS3(): boolean {
    return Boolean(this.s3 && env.s3.bucket);
  }

  async uploadFiles(files: Express.Multer.File[], userId?: string): Promise<StoredImage[]> {
    if (!files?.length) {
      throw new BadRequestException("Choose at least one image to upload.");
    }
    if (files.length > UPLOAD_MAX_FILES) {
      throw new BadRequestException(`You can upload up to ${UPLOAD_MAX_FILES} photos.`);
    }
    const stored: StoredImage[] = [];
    for (const file of files) {
      stored.push(await this.uploadFile(file, userId));
    }
    return stored;
  }

  async uploadFile(file: Express.Multer.File, userId?: string): Promise<StoredImage> {
    this.assertImage(file.mimetype, file.size, file.originalname);
    const key = this.buildKey(file.mimetype, userId);
    if (this.usesS3()) {
      await this.s3!.send(
        new PutObjectCommand({
          Bucket: env.s3.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: "public, max-age=31536000",
        }),
      );
    } else {
      const dest = join(this.localDir, key);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, file.buffer);
    }
    return {
      key,
      url: this.publicUrl(key),
      contentType: file.mimetype,
      size: file.size,
    };
  }

  async presign(contentType: string, fileName?: string, userId?: string) {
    this.assertImage(contentType, 1, fileName);
    if (!this.usesS3()) {
      throw new ServiceUnavailableException(
        "S3 is not configured. Use POST /api/uploads/images to store files locally.",
      );
    }
    const key = this.buildKey(contentType, userId);
    const command = new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000",
    });
    const uploadUrl = await getSignedUrl(this.s3!, command, { expiresIn: 300 });
    return {
      key,
      url: this.publicUrl(key),
      uploadUrl,
      method: "PUT" as const,
      headers: { "Content-Type": contentType },
      expiresIn: 300,
    };
  }

  publicUrl(key: string): string {
    if (this.usesS3()) {
      const base = env.s3.publicBaseUrl.replace(/\/$/, "");
      if (base) {
        return `${base}/${key}`;
      }
      return `https://${env.s3.bucket}.s3.${env.s3.region}.amazonaws.com/${key}`;
    }
    return `/api/uploads/files/${key}`;
  }

  private buildKey(contentType: string, userId?: string): string {
    const ext = UPLOAD_EXTENSIONS[contentType] ?? "jpg";
    const prefix = userId ? `users/${userId}/photos` : "pending";
    return `${prefix}/${randomUUID()}.${ext}`;
  }

  private assertImage(contentType: string, size: number, fileName?: string) {
    const mime = contentType?.toLowerCase();
    if (!UPLOAD_MIME_TYPES.includes(mime as (typeof UPLOAD_MIME_TYPES)[number])) {
      throw new BadRequestException("Only JPEG, PNG, WebP, or GIF images are allowed.");
    }
    if (size > UPLOAD_MAX_BYTES) {
      throw new BadRequestException("Each photo must be 5 MB or smaller.");
    }
    if (fileName && fileName.includes("..")) {
      throw new BadRequestException("Invalid file name.");
    }
  }
}
