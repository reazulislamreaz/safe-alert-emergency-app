"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../../config/env.js");
const database_js_1 = require("../../core/database.js");
class AuthService {
    login(emailOrPhone, pin) {
        const user = database_js_1.db.users.find((u) => u.email.toLowerCase() === emailOrPhone.toLowerCase() ||
            u.phone.replace(/\D/g, "") === emailOrPhone.replace(/\D/g, ""));
        if (!user) {
            throw new Error("Invalid credentials or user not found");
        }
        if (pin && user.pin !== pin) {
            throw new Error("Invalid security PIN");
        }
        const token = jsonwebtoken_1.default.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            tier: user.subscriptionTier,
        }, env_js_1.config.jwtSecret, { expiresIn: "7d" });
        return { user, token };
    }
    verifyPin(userId, pin) {
        const user = database_js_1.db.users.find((u) => u.id === userId);
        if (!user)
            return false;
        return user.pin === pin;
    }
    getCurrentUser(userId) {
        return database_js_1.db.users.find((u) => u.id === userId);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
