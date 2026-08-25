import jwt from "jsonwebtoken";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { config } from "../../config/env.js";
import { db, User, OtpRecord } from "../../core/database.js";
import { AuthenticatedUserPayload } from "./auth.middleware.js";

// Validation Schemas
export const RegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Invalid phone number format"),
  dob: z.string().optional(),
  race: z.string().optional(),
  location: z.string().optional(),
  emergencyContactName: z.string().min(2, "Emergency contact name required"),
  emergencyContactPhone: z.string().min(7, "Emergency contact phone required"),
  emergencyContactRelation: z.string().min(2, "Relationship required"),
  profilePhotos: z.array(z.string()).optional(),
  pin: z.string().regex(/^\d{4}$/, "PIN must be a 4-digit number").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const LoginSchema = z.object({
  emailOrPhone: z.string().min(3, "Email or phone number is required"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits").optional(),
  password: z.string().min(4).optional(),
});

export const SendOtpSchema = z.object({
  phone: z.string().min(7, "Valid phone number is required"),
});

export const VerifyOtpSchema = z.object({
  phone: z.string().min(7, "Valid phone number is required"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

export const SetupPinSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  pin: z.string().regex(/^\d{4}$/, "Security PIN must be exactly 4 digits"),
});

export const VerifyPinSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  pin: z.string().regex(/^\d{4}$/, "Security PIN must be exactly 4 digits"),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;

export class AuthService {
  /**
   * Register a new Citizen user account matching the Mobile onboarding flow
   */
  register(dto: RegisterDto): { user: Omit<User, "pin" | "password">; token: string; otpCode: string } {
    const validated = RegisterSchema.parse(dto);

    // Check if email or phone already exists
    const existing = db.users.find(
      (u) =>
        u.email.toLowerCase() === validated.email.toLowerCase() ||
        u.phone.replace(/\D/g, "") === validated.phone.replace(/\D/g, "")
    );

    if (existing) {
      throw new Error("An account with this email or phone number already exists.");
    }

    const newUser: User = {
      id: `usr-${uuidv4().substring(0, 8)}`,
      fullName: validated.fullName,
      email: validated.email.toLowerCase(),
      phone: validated.phone,
      role: "USER",
      subscriptionTier: "FREE",
      isVerified: false,
      isPhoneVerified: false,
      pin: validated.pin || "0000",
      password: validated.password,
      dob: validated.dob,
      race: validated.race,
      location: validated.location,
      emergencyContactName: validated.emergencyContactName,
      emergencyContactPhone: validated.emergencyContactPhone,
      emergencyContactRelation: validated.emergencyContactRelation,
      profilePhotos: validated.profilePhotos || [],
      avatar: validated.profilePhotos?.[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Auto-create default Family Emergency Contact Group
    const defaultGroup = {
      id: `grp-${uuidv4().substring(0, 8)}`,
      userId: newUser.id,
      name: "Family (Primary)",
      color: "#2563EB",
      isDefaultSOS: true,
      memberCount: 1,
    };
    db.contactGroups.push(defaultGroup);

    db.contactMembers.push({
      id: `mem-${uuidv4().substring(0, 8)}`,
      groupId: defaultGroup.id,
      name: validated.emergencyContactName,
      phone: validated.emergencyContactPhone,
      relationship: validated.emergencyContactRelation,
    });

    // Generate initial OTP for verification step
    const otp = this.sendPhoneOtp(newUser.phone);
    const token = this.generateToken(newUser);

    const { pin: _pin, password: _pwd, ...safeUser } = newUser;
    return { user: safeUser, token, otpCode: otp.code };
  }

  /**
   * Generates a 6-digit phone verification OTP
   */
  sendPhoneOtp(phone: string): { phone: string; code: string; expiresInMinutes: number } {
    const cleanPhone = phone.replace(/\D/g, "");
    
    // Generate deterministic demo code '123456' for known test phones or random 6-digit
    const code = cleanPhone.endsWith("0000") || cleanPhone.endsWith("5678")
      ? "123456"
      : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = Date.now() + config.otpExpiryMinutes * 60 * 1000;

    const record: OtpRecord = {
      phone: cleanPhone,
      code,
      expiresAt,
      attempts: 0,
    };

    db.otpStore.set(cleanPhone, record);

    return {
      phone,
      code, // In production SMS gateway delivers this
      expiresInMinutes: config.otpExpiryMinutes,
    };
  }

  /**
   * Verifies the 6-digit phone OTP
   */
  verifyPhoneOtp(phone: string, code: string): { verified: boolean; message: string; token?: string; user?: Omit<User, "pin" | "password"> } {
    const cleanPhone = phone.replace(/\D/g, "");
    const record = db.otpStore.get(cleanPhone);

    if (!record) {
      throw new Error("No pending verification found for this phone number. Please request a new code.");
    }

    if (Date.now() > record.expiresAt) {
      db.otpStore.delete(cleanPhone);
      throw new Error("Verification code has expired. Please request a new code.");
    }

    if (record.code !== code) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        db.otpStore.delete(cleanPhone);
        throw new Error("Too many failed attempts. Verification code invalidated.");
      }
      throw new Error("Invalid verification code. Please check and try again.");
    }

    // Mark successful verification
    db.otpStore.delete(cleanPhone);

    const user = db.users.find((u) => u.phone.replace(/\D/g, "") === cleanPhone);
    if (user) {
      user.isPhoneVerified = true;
      user.isVerified = true;
      const token = this.generateToken(user);
      const { pin: _p, password: _pw, ...safeUser } = user;
      return { verified: true, message: "Phone successfully verified.", token, user: safeUser };
    }

    return { verified: true, message: "Phone verified successfully." };
  }

  /**
   * Setup or Update 4-Digit De-escalation Security PIN
   */
  setupPin(userId: string, pin: string): { success: boolean; message: string } {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error("PIN must be a 4-digit number.");
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error("User not found.");
    }

    user.pin = pin;
    return { success: true, message: "Security PIN updated successfully." };
  }

  /**
   * Verify 4-Digit PIN (Used for SOS Cancellation and Quick Access)
   */
  verifyPin(userId: string, pin: string): { valid: boolean; isDuressPin?: boolean } {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { valid: false };

    // Standard PIN match
    const isValid = user.pin === pin;
    return { valid: isValid };
  }

  /**
   * Authenticate user / admin by email/phone + PIN or Password
   */
  login(dto: LoginDto): { user: Omit<User, "pin" | "password">; token: string } {
    const { emailOrPhone, pin, password } = LoginSchema.parse(dto);

    const cleanInput = emailOrPhone.toLowerCase().trim();
    const cleanPhone = emailOrPhone.replace(/\D/g, "");

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        (cleanPhone.length >= 7 && u.phone.replace(/\D/g, "") === cleanPhone)
    );

    if (!user) {
      throw new Error("Invalid credentials. Account not found.");
    }

    // Verify Password (if provided or admin) or PIN
    if (password) {
      if (user.password && user.password !== password) {
        throw new Error("Incorrect password.");
      }
    } else if (pin) {
      if (user.pin !== pin) {
        throw new Error("Incorrect 4-digit security PIN.");
      }
    } else {
      // If neither pin nor password is provided, require one
      throw new Error("Please provide your 4-digit PIN or password to log in.");
    }

    const token = this.generateToken(user);
    const { pin: _pin, password: _pwd, ...safeUser } = user;

    return { user: safeUser, token };
  }

  /**
   * Fetch authenticated user's profile with active groups & active alerts
   */
  getMe(userId: string): {
    user: Omit<User, "pin" | "password">;
    groups: any[];
    activeAlerts: any[];
  } {
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error("User account not found.");
    }

    const groups = db.contactGroups.filter((g) => g.userId === userId);
    const activeAlerts = db.activeAlerts.filter(
      (a) => a.userId === userId && (a.status === "TRIGGERED" || a.status === "BROADCASTING")
    );

    const { pin: _pin, password: _pwd, ...safeUser } = user;
    return {
      user: safeUser,
      groups,
      activeAlerts,
    };
  }

  /**
   * Generate signed JWT token
   */
  private generateToken(user: User): string {
    const payload: AuthenticatedUserPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tier: user.subscriptionTier,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });
  }
}

export const authService = new AuthService();
