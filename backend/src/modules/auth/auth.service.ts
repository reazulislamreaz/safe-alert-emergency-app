import jwt from "jsonwebtoken";
import { config } from "../../config/env.js";
import { db, User } from "../../core/database.js";

export class AuthService {
  login(emailOrPhone: string, pin?: string): { user: User; token: string } {
    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === emailOrPhone.toLowerCase() ||
        u.phone.replace(/\D/g, "") === emailOrPhone.replace(/\D/g, "")
    );

    if (!user) {
      throw new Error("Invalid credentials or user not found");
    }

    if (pin && user.pin !== pin) {
      throw new Error("Invalid security PIN");
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tier: user.subscriptionTier,
      },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    return { user, token };
  }

  verifyPin(userId: string, pin: string): boolean {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return false;
    return user.pin === pin;
  }

  getCurrentUser(userId: string): User | undefined {
    return db.users.find((u) => u.id === userId);
  }
}

export const authService = new AuthService();
