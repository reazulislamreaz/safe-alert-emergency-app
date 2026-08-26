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
