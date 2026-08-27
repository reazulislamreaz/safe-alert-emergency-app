import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), "../.env"));

const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

export const env = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  jwtSecret: process.env.JWT_SECRET || "safealert_super_secret_jwt_key_2026_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  otpExpiryMinutes: process.env.OTP_EXPIRY_MINUTES
    ? parseInt(process.env.OTP_EXPIRY_MINUTES, 10)
    : 10,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  environment: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  zegoAppId: process.env.ZEGO_APP_ID ? parseInt(process.env.ZEGO_APP_ID, 10) : 0,
  zegoServerSecret: process.env.ZEGO_SERVER_SECRET || "",
  s3: {
    region: process.env.AWS_REGION || "us-east-1",
    bucket: process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || "",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL || "",
  },
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "",
  dashboardAdminEmail: (process.env.DASHBOARD_ADMIN_EMAIL || "admin@safealert.app")
    .trim()
    .toLowerCase(),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number.isFinite(smtpPort) ? smtpPort : 587,
    user: process.env.SMTP_USER || "",
    pass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
    secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
  },
};

export type JwtAudience = "app" | "dashboard";

export type JwtPayload = {
  sub: string;
  email: string;
  phone: string;
  role: "USER" | "SUPER_ADMIN";
  tier: "FREE" | "PREMIUM";
  aud?: JwtAudience;
  iat?: number;
  exp?: number;
};
