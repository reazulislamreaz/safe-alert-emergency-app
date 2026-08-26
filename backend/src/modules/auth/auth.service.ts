import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { AlertStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { env, JwtPayload } from "../../config/env";
import { digitsOnly } from "../../common/utils/phone";
import { toPublicUser } from "../../common/mappers/user.mapper";
import { alertInclude, toAlertDto } from "../../common/mappers/alert.mapper";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const phoneDigits = digitsOnly(dto.phone);

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneDigits }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        "An account with this email or phone number already exists.",
      );
    }

    const pinHash = await hash(dto.pin || "0000", 10);
    const passwordHash = dto.password ? await hash(dto.password, 10) : null;
    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;

    const user = await this.prisma.user.create({
      data: {
        id: userId,
        fullName: dto.fullName,
        email,
        phone: dto.phone,
        phoneDigits,
        pinHash,
        passwordHash,
        dob: dto.dob,
        race: dto.race,
        location: dto.location,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone || dto.phone,
        emergencyContactRelation: dto.emergencyContactRelation || "Emergency Contact",
        profilePhotos: dto.profilePhotos ?? [],
        avatar:
          dto.profilePhotos?.[0] ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        contactGroups: {
          create: {
            id: `grp-${crypto.randomUUID().slice(0, 8)}`,
            name: "Family (Primary)",
            color: "#2563EB",
            isDefaultSOS: true,
            memberCount: 1,
            members: {
              create: {
                id: `mem-${crypto.randomUUID().slice(0, 8)}`,
                name: dto.emergencyContactName,
                phone: dto.emergencyContactPhone || dto.phone,
                relationship: dto.emergencyContactRelation || "Emergency Contact",
              },
            },
          },
        },
      },
    });

    const otp = await this.sendPhoneOtp(user.phone);
    const token = this.signToken(user.id, user.email, user.phone, user.role, user.subscriptionTier);

    return { user: toPublicUser(user), token, otpCode: otp.code };
  }

  async sendPhoneOtp(phone: string) {
    const cleanPhone = digitsOnly(phone);
    const code =
      cleanPhone.endsWith("0000") || cleanPhone.endsWith("5678")
        ? "123456"
        : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

    await this.prisma.phoneOtp.upsert({
      where: { phone: cleanPhone },
      create: { phone: cleanPhone, code, expiresAt, attempts: 0, verified: false },
      update: { code, expiresAt, attempts: 0, verified: false },
    });

    return {
      phone,
      code,
      expiresInMinutes: env.otpExpiryMinutes,
    };
  }

  async verifyPhoneOtp(phone: string, code: string) {
    const cleanPhone = digitsOnly(phone);
    const record = await this.prisma.phoneOtp.findUnique({ where: { phone: cleanPhone } });

    if (!record) {
      throw new BadRequestException(
        "No pending verification found for this phone number. Please request a new code.",
      );
    }

    if (Date.now() > record.expiresAt.getTime()) {
      await this.prisma.phoneOtp.delete({ where: { phone: cleanPhone } });
      throw new BadRequestException(
        "Verification code has expired. Please request a new code.",
      );
    }

    if (record.code !== code) {
      const attempts = record.attempts + 1;
      if (attempts >= 5) {
        await this.prisma.phoneOtp.delete({ where: { phone: cleanPhone } });
        throw new BadRequestException(
          "Too many failed attempts. Verification code invalidated.",
        );
      }
      await this.prisma.phoneOtp.update({
        where: { phone: cleanPhone },
        data: { attempts },
      });
      throw new BadRequestException("Invalid verification code. Please check and try again.");
    }

    await this.prisma.phoneOtp.delete({ where: { phone: cleanPhone } });

    const user = await this.prisma.user.findFirst({ where: { phoneDigits: cleanPhone } });
    if (user) {
      const verified = await this.prisma.user.update({
        where: { id: user.id },
        data: { isPhoneVerified: true, isVerified: true },
      });
      const token = this.signToken(
        verified.id,
        verified.email,
        verified.phone,
        verified.role,
        verified.subscriptionTier,
      );
      return {
        verified: true,
        message: "Phone successfully verified.",
        token,
        user: toPublicUser(verified),
      };
    }

    return { verified: true, message: "Phone verified successfully." };
  }

  async setupPin(userId: string, pin: string) {
    if (!/^\d{1,4}$/.test(pin)) {
      throw new BadRequestException("PIN must be 1 to 4 digits.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found.");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { pinHash: await hash(pin, 10) },
    });

    return { success: true, message: "Security PIN updated successfully." };
  }

  async verifyPin(userId: string, pin: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { valid: false };
    }

    const valid = await compare(pin, user.pinHash);
    return { valid };
  }

  async login(dto: LoginDto) {
    const cleanInput = dto.emailOrPhone.toLowerCase().trim();
    const cleanPhone = digitsOnly(dto.emailOrPhone);

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          ...(cleanPhone.length >= 7 ? [{ phoneDigits: cleanPhone }] : []),
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials. Account not found.");
    }

    if (dto.password) {
      if (!user.passwordHash || !(await compare(dto.password, user.passwordHash))) {
        throw new UnauthorizedException("Incorrect password.");
      }
    } else if (dto.pin) {
      if (!(await compare(dto.pin, user.pinHash))) {
        throw new UnauthorizedException("Incorrect security PIN.");
      }
    } else {
      throw new UnauthorizedException(
        "Please provide your security PIN or password to log in.",
      );
    }

    const token = this.signToken(user.id, user.email, user.phone, user.role, user.subscriptionTier);
    return { user: toPublicUser(user), token };
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      throw new NotFoundException("No account found with this email address.");
    }

    const code = "123456";
    const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

    await this.prisma.emailOtp.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, code, expiresAt, attempts: 0, verified: false },
      update: { code, expiresAt, attempts: 0, verified: false },
    });

    return {
      email: normalizedEmail,
      code,
      expiresInMinutes: env.otpExpiryMinutes,
    };
  }

  async verifyPasswordResetOtp(email: string, code: string) {
    const record = await this.getActiveEmailOtp(email);

    if (record.code !== code) {
      await this.recordFailedOtpAttempt(record.email);
      throw new BadRequestException("Invalid verification code. Please check and try again.");
    }

    await this.prisma.emailOtp.update({
      where: { email: record.email },
      data: { verified: true },
    });

    return { verified: true, message: "Email verified. You may now set a new password." };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const record = await this.getActiveEmailOtp(email);

    if (record.code !== code) {
      throw new BadRequestException("Invalid verification code. Please request a new code.");
    }

    if (!record.verified) {
      throw new BadRequestException("Please verify the code before resetting your password.");
    }

    const user = await this.prisma.user.findUnique({ where: { email: record.email } });
    if (!user) {
      throw new NotFoundException("User account not found.");
    }

    const passwordHash = await hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.emailOtp.delete({ where: { email: record.email } }),
    ]);

    return { message: "Password updated successfully." };
  }

  async requestPinReset(phone: string) {
    const cleanPhone = digitsOnly(phone);
    const user = await this.prisma.user.findFirst({ where: { phoneDigits: cleanPhone } });

    if (!user) {
      throw new NotFoundException("No account found with this phone number.");
    }

    return this.sendPhoneOtp(user.phone);
  }

  async verifyPinResetOtp(phone: string, code: string) {
    const record = await this.getActivePhoneOtp(phone);

    if (record.code !== code) {
      await this.recordFailedPhoneOtpAttempt(record.phone);
      throw new BadRequestException("Invalid verification code. Please check and try again.");
    }

    await this.prisma.phoneOtp.update({
      where: { phone: record.phone },
      data: { verified: true },
    });

    return { verified: true, message: "Phone verified. You may now set a new PIN." };
  }

  async resetPin(phone: string, code: string, newPin: string) {
    if (!/^\d{1,4}$/.test(newPin)) {
      throw new BadRequestException("PIN must be 1 to 4 digits.");
    }

    const record = await this.getActivePhoneOtp(phone);

    if (record.code !== code) {
      throw new BadRequestException("Invalid verification code. Please request a new code.");
    }

    if (!record.verified) {
      throw new BadRequestException("Please verify the code before setting a new PIN.");
    }

    const user = await this.prisma.user.findFirst({
      where: { phoneDigits: record.phone },
    });
    if (!user) {
      throw new NotFoundException("User account not found.");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { pinHash: await hash(newPin, 10) },
      }),
      this.prisma.phoneOtp.delete({ where: { phone: record.phone } }),
    ]);

    return { message: "PIN updated successfully." };
  }

  private async getActivePhoneOtp(phone: string) {
    const cleanPhone = digitsOnly(phone);
    const record = await this.prisma.phoneOtp.findUnique({ where: { phone: cleanPhone } });

    if (!record) {
      throw new BadRequestException(
        "No pending verification found for this phone number. Please request a new code.",
      );
    }

    if (Date.now() > record.expiresAt.getTime()) {
      await this.prisma.phoneOtp.delete({ where: { phone: cleanPhone } });
      throw new BadRequestException("Verification code has expired. Please request a new code.");
    }

    return record;
  }

  private async recordFailedPhoneOtpAttempt(phone: string) {
    const record = await this.prisma.phoneOtp.findUnique({ where: { phone } });
    if (!record) return;

    const attempts = record.attempts + 1;
    if (attempts >= 5) {
      await this.prisma.phoneOtp.delete({ where: { phone } });
      throw new BadRequestException("Too many failed attempts. Verification code invalidated.");
    }

    await this.prisma.phoneOtp.update({
      where: { phone },
      data: { attempts },
    });
  }

  private async getActiveEmailOtp(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const record = await this.prisma.emailOtp.findUnique({ where: { email: normalizedEmail } });

    if (!record) {
      throw new BadRequestException(
        "No pending verification found for this email. Please request a new code.",
      );
    }

    if (Date.now() > record.expiresAt.getTime()) {
      await this.prisma.emailOtp.delete({ where: { email: normalizedEmail } });
      throw new BadRequestException("Verification code has expired. Please request a new code.");
    }

    return record;
  }

  private async recordFailedOtpAttempt(email: string) {
    const record = await this.prisma.emailOtp.findUnique({ where: { email } });
    if (!record) return;

    const attempts = record.attempts + 1;
    if (attempts >= 5) {
      await this.prisma.emailOtp.delete({ where: { email } });
      throw new BadRequestException("Too many failed attempts. Verification code invalidated.");
    }

    await this.prisma.emailOtp.update({
      where: { email },
      data: { attempts },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User account not found.");
    }

    const groups = await this.prisma.contactGroup.findMany({
      where: { userId },
      include: { members: true },
    });

    const activeAlerts = await this.prisma.alert.findMany({
      where: {
        userId,
        status: { in: [AlertStatus.TRIGGERED, AlertStatus.BROADCASTING] },
      },
      include: alertInclude,
    });

    return {
      user: toPublicUser(user),
      groups,
      activeAlerts: activeAlerts.map(toAlertDto),
    };
  }

  private signToken(
    userId: string,
    email: string,
    phone: string,
    role: JwtPayload["role"],
    tier: JwtPayload["tier"],
  ): string {
    const payload: JwtPayload = { sub: userId, email, phone, role, tier };
    return this.jwt.sign(payload);
  }
}
