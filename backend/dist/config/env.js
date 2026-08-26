"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.env = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
    jwtSecret: process.env.JWT_SECRET || "safealert_super_secret_jwt_key_2026_production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    otpExpiryMinutes: process.env.OTP_EXPIRY_MINUTES
        ? parseInt(process.env.OTP_EXPIRY_MINUTES, 10)
        : 10,
    corsOrigin: process.env.CORS_ORIGIN || "*",
    environment: process.env.NODE_ENV || "development",
    databaseUrl: process.env.DATABASE_URL || "",
};
//# sourceMappingURL=env.js.map