"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
    jwtSecret: process.env.JWT_SECRET || "safealert_super_secret_jwt_key_2026_production",
    corsOrigin: process.env.CORS_ORIGIN || "*",
    environment: process.env.NODE_ENV || "development",
};
