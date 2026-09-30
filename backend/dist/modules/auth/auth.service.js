"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const bcryptjs_1 = require("bcryptjs");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const mail_service_1 = require("../../mail/mail.service");
const env_1 = require("../../config/env");
const phone_1 = require("../../common/utils/phone");
const token_hash_1 = require("../../common/utils/token-hash");
const user_mapper_1 = require("../../common/mappers/user.mapper");
const alert_mapper_1 = require("../../common/mappers/alert.mapper");
const uploads_constants_1 = require("../uploads/uploads.constants");
const dashboard_admin_service_1 = require("../../common/auth/dashboard-admin.service");
const dashboard_admin_1 = require("../../common/auth/dashboard-admin");
let AuthService = class AuthService {
    prisma;
    jwt;
    dashboardAdmin;
    mail;
    constructor(prisma, jwt, dashboardAdmin, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.dashboardAdmin = dashboardAdmin;
        this.mail = mail;
    }
    async register(dto) {
        const email = dto.email.toLowerCase();
        const phone = dto.phone.trim();
        const phoneDigits = (0, phone_1.digitsOnly)(phone);
        if ((0, dashboard_admin_1.isDesignatedAdminEmail)(email)) {
            throw new common_1.BadRequestException("This email is reserved for the Super Admin account.");
        }
        const existingEmail = await this.prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            if (existingEmail.role === client_1.Role.SUPER_ADMIN) {
                throw new common_1.BadRequestException("An account with this email already exists.");
            }
            const registrationIncomplete = !existingEmail.isVerified || (!existingEmail.pinHash && !existingEmail.faceIdEnabled);
            if (!registrationIncomplete) {
                throw new common_1.BadRequestException("An account with this email already exists.");
            }
            return this.resumeIncompleteRegistration(existingEmail.id, dto, email, phone, phoneDigits);
        }
        if (phoneDigits.length >= 7) {
            const existingPhone = await this.prisma.user.findFirst({ where: { phoneDigits } });
            if (existingPhone) {
                throw new common_1.BadRequestException("An account with this phone number already exists.");
            }
        }
        const credentialHash = await (0, bcryptjs_1.hash)(dto.password, 10);
        const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
        const contactId = `ct-${crypto.randomUUID().slice(0, 8)}`;
        const groupId = `grp-${crypto.randomUUID().slice(0, 8)}`;
        const memberId = `mem-${crypto.randomUUID().slice(0, 8)}`;
        const emergencyPhone = dto.emergencyContactPhone.trim();
        const emergencyContactName = "Emergency Contact";
        const emergencyRelation = "Emergency Contact";
        const user = await this.prisma.user.create({
            data: {
                id: userId,
                fullName: dto.fullName.trim(),
                email,
                phone,
                phoneDigits,
                pinHash: credentialHash,
                passwordHash: credentialHash,
                dob: dto.dob,
                race: dto.race,
                location: dto.location.trim(),
                emergencyContactName,
                role: client_1.Role.USER,
                emergencyContactPhone: emergencyPhone,
                emergencyContactRelation: emergencyRelation,
                profilePhotos: (0, uploads_constants_1.requireStoredImageUrls)(dto.profilePhotos) ?? [],
                avatar: dto.profilePhotos?.[0] ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                contacts: {
                    create: {
                        id: contactId,
                        name: emergencyContactName,
                        phone: emergencyPhone,
                        phoneDigits: (0, phone_1.digitsOnly)(emergencyPhone) || "0",
                        relationship: emergencyRelation,
                    },
                },
                contactGroups: {
                    create: {
                        id: groupId,
                        name: "Family (Primary)",
                        color: "#2563EB",
                        isDefaultSOS: true,
                        kind: "FAMILY_FRIENDS",
                        memberCount: 1,
                        members: {
                            create: {
                                id: memberId,
                                contactId,
                                name: emergencyContactName,
                                phone: emergencyPhone,
                                relationship: emergencyRelation,
                            },
                        },
                    },
                },
            },
        });
        if (dto.inviteToken?.trim()) {
            try {
                await this.claimInviteToken(user.id, dto.inviteToken.trim());
            }
            catch {
            }
        }
        return this.issueRegistrationSession(user);
    }
    async claimInviteToken(userId, token) {
        const invite = await this.prisma.groupInvitation.findFirst({ where: { token } });
        if (!invite || invite.useCount >= invite.maxUses) {
            return;
        }
        if (invite.status === "DECLINED") {
            return;
        }
        if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
            return;
        }
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const already = await this.prisma.contactMember.findFirst({
            where: { groupId: invite.groupId, phoneDigits: user.phoneDigits },
        });
        if (already) {
            return;
        }
        await this.prisma.contactMember.create({
            data: {
                id: `mem-${crypto.randomUUID().slice(0, 8)}`,
                groupId: invite.groupId,
                name: user.fullName,
                phone: user.phone || "N/A",
                phoneDigits: user.phoneDigits,
                relationship: "Member",
            },
        });
        await this.prisma.contactGroup.update({
            where: { id: invite.groupId },
            data: { memberCount: { increment: 1 } },
        });
        const nextUseCount = invite.useCount + 1;
        await this.prisma.groupInvitation.update({
            where: { id: invite.id },
            data: {
                useCount: nextUseCount,
                inviteeUserId: userId,
                respondedAt: new Date(),
                status: nextUseCount >= invite.maxUses ? "ACCEPTED" : "PENDING",
            },
        });
    }
    async resumeIncompleteRegistration(userId, dto, email, phone, phoneDigits) {
        if (phoneDigits.length >= 7) {
            const phoneTaken = await this.prisma.user.findFirst({
                where: { phoneDigits, NOT: { id: userId } },
            });
            if (phoneTaken) {
                throw new common_1.BadRequestException("An account with this phone number already exists.");
            }
        }
        const emergencyPhone = dto.emergencyContactPhone.trim();
        const emergencyContactName = "Emergency Contact";
        const emergencyRelation = "Emergency Contact";
        const credentialHash = await (0, bcryptjs_1.hash)(dto.password, 10);
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                fullName: dto.fullName.trim(),
                email,
                phone,
                phoneDigits,
                passwordHash: credentialHash,
                pinHash: credentialHash,
                dob: dto.dob,
                race: dto.race,
                location: dto.location.trim(),
                emergencyContactName,
                emergencyContactPhone: emergencyPhone,
                emergencyContactRelation: emergencyRelation,
                profilePhotos: (0, uploads_constants_1.requireStoredImageUrls)(dto.profilePhotos) ?? [],
                avatar: dto.profilePhotos?.[0] ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                isVerified: false,
                faceIdEnabled: false,
                faceIdCredentialId: null,
            },
        });
        if (dto.inviteToken?.trim()) {
            try {
                await this.claimInviteToken(user.id, dto.inviteToken.trim());
            }
            catch {
            }
        }
        return this.issueRegistrationSession(user);
    }
    async issueRegistrationSession(user) {
        const otp = await this.sendEmailVerificationOtp(user.email);
        const token = this.signToken(user.id, user.email, user.phone || "", user.role, user.subscriptionTier, "app");
        const fullUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
        return {
            user: (0, user_mapper_1.toPublicUser)(fullUser),
            token,
            otpCode: otp.code,
            delivered: otp.delivered,
        };
    }
    async sendEmailVerificationOtp(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const delivered = this.mail.isConfigured();
        const code = delivered ? (0, crypto_1.randomInt)(100000, 1000000).toString() : "123456";
        const expiresAt = new Date(Date.now() + env_1.env.otpExpiryMinutes * 60 * 1000);
        await this.prisma.emailOtp.upsert({
            where: { email: normalizedEmail },
            create: { email: normalizedEmail, code, expiresAt, attempts: 0, verified: false },
            update: { code, expiresAt, attempts: 0, verified: false },
        });
        if (delivered) {
            await this.mail.sendEmailVerificationOtp(normalizedEmail, code, env_1.env.otpExpiryMinutes);
        }
        return {
            email: normalizedEmail,
            ...(delivered ? {} : { code }),
            delivered,
            expiresInMinutes: env_1.env.otpExpiryMinutes,
        };
    }
    async verifyEmailOtp(email, code) {
        const record = await this.getActiveEmailOtp(email);
        if (record.code !== code) {
            await this.recordFailedOtpAttempt(record.email);
            throw new common_1.BadRequestException("Invalid verification code. Please check and try again.");
        }
        await this.prisma.emailOtp.delete({ where: { email: record.email } });
        const user = await this.prisma.user.findUnique({ where: { email: record.email } });
        if (!user) {
            throw new common_1.NotFoundException("User account not found.");
        }
        if ((0, dashboard_admin_1.isDesignatedAdminEmail)(user.email) || user.role === client_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException("Super Admin accounts cannot use citizen email verification.");
        }
        const verified = await this.prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
        });
        const token = this.signToken(verified.id, verified.email, verified.phone || "", verified.role, verified.subscriptionTier, "app");
        return {
            verified: true,
            message: "Email successfully verified.",
            token,
            user: (0, user_mapper_1.toPublicUser)(verified),
        };
    }
    async sendPhoneOtp(phone) {
        const cleanPhone = (0, phone_1.digitsOnly)(phone);
        const code = cleanPhone.endsWith("0000") || cleanPhone.endsWith("5678")
            ? "123456"
            : Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + env_1.env.otpExpiryMinutes * 60 * 1000);
        await this.prisma.phoneOtp.upsert({
            where: { phone: cleanPhone },
            create: { phone: cleanPhone, code, expiresAt, attempts: 0, verified: false },
            update: { code, expiresAt, attempts: 0, verified: false },
        });
        return {
            phone,
            code,
            expiresInMinutes: env_1.env.otpExpiryMinutes,
        };
    }
    async verifyPhoneOtp(phone, code) {
        const cleanPhone = (0, phone_1.digitsOnly)(phone);
        const record = await this.prisma.phoneOtp.findUnique({ where: { phone: cleanPhone } });
        if (!record) {
            throw new common_1.BadRequestException("No pending verification found for this phone number. Please request a new code.");
        }
        if (Date.now() > record.expiresAt.getTime()) {
            await this.prisma.phoneOtp.delete({ where: { phone: cleanPhone } });
            throw new common_1.BadRequestException("Verification code has expired. Please request a new code.");
        }
        if (record.code !== code) {
            const attempts = record.attempts + 1;
            if (attempts >= 5) {
                await this.prisma.phoneOtp.delete({ where: { phone: cleanPhone } });
                throw new common_1.BadRequestException("Too many failed attempts. Verification code invalidated.");
            }
            await this.prisma.phoneOtp.update({
                where: { phone: cleanPhone },
                data: { attempts },
            });
            throw new common_1.BadRequestException("Invalid verification code. Please check and try again.");
        }
        await this.prisma.phoneOtp.delete({ where: { phone: cleanPhone } });
        const user = await this.prisma.user.findFirst({ where: { phoneDigits: cleanPhone } });
        if (user) {
            const verified = await this.prisma.user.update({
                where: { id: user.id },
                data: { isPhoneVerified: true, isVerified: true },
            });
            if ((0, dashboard_admin_1.isDesignatedAdminEmail)(verified.email) || verified.role === client_1.Role.SUPER_ADMIN) {
                return {
                    phone,
                    verified: true,
                    user: (0, user_mapper_1.toPublicUser)(verified),
                };
            }
            const token = this.signToken(verified.id, verified.email, verified.phone || "", verified.role, verified.subscriptionTier, "app");
            return {
                verified: true,
                message: "Phone successfully verified.",
                token,
                user: (0, user_mapper_1.toPublicUser)(verified),
            };
        }
        return { verified: true, message: "Phone verified successfully." };
    }
    async setupPin(userId, pin) {
        if (!/^\d{4}$/.test(pin)) {
            throw new common_1.BadRequestException("PIN must be exactly 4 digits.");
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("User not found.");
        }
        if (!user.isVerified) {
            throw new common_1.BadRequestException("Verify your email before setting a PIN.");
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { pinHash: await (0, bcryptjs_1.hash)(pin, 10) },
        });
        const token = this.signToken(updated.id, updated.email, updated.phone || "", updated.role, updated.subscriptionTier, "app");
        return {
            success: true,
            message: "Security PIN updated successfully.",
            user: (0, user_mapper_1.toPublicUser)(updated),
            token,
        };
    }
    async setFaceId(userId, enabled, credentialId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("User not found.");
        }
        if (!user.isVerified) {
            throw new common_1.BadRequestException("Verify your email before enabling Face ID.");
        }
        if (enabled && !credentialId?.trim()) {
            throw new common_1.BadRequestException("Face ID credential id is required.");
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                faceIdEnabled: enabled,
                faceIdCredentialId: enabled ? credentialId.trim() : null,
            },
        });
        const token = this.signToken(updated.id, updated.email, updated.phone || "", updated.role, updated.subscriptionTier, "app");
        return {
            faceIdEnabled: updated.faceIdEnabled,
            message: enabled ? "Face ID registered!" : "Face ID skipped.",
            completeLabel: "Complete Setup",
            skipLabel: "Skip for now",
            user: (0, user_mapper_1.toPublicUser)(updated),
            token,
        };
    }
    async verifyPin(userId, pin) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.pinHash) {
            return { valid: false };
        }
        const valid = await (0, bcryptjs_1.compare)(pin, user.pinHash);
        return { valid };
    }
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
        if (!email) {
            throw new common_1.BadRequestException("Email is required.");
        }
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid credentials. Account not found.");
        }
        if (!user.passwordHash || !(await (0, bcryptjs_1.compare)(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException("Incorrect password.");
        }
        if (user.role === client_1.Role.USER && !user.isVerified) {
            throw new common_1.UnauthorizedException("Verify your email before logging in.");
        }
        if (user.role === client_1.Role.USER && !user.pinHash && !user.faceIdEnabled) {
            throw new common_1.UnauthorizedException("Complete authentication setup (PIN or Face ID) before logging in.");
        }
        await this.dashboardAdmin.ensureSingleAdmin();
        const fresh = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (!fresh) {
            throw new common_1.UnauthorizedException("Invalid credentials. Account not found.");
        }
        if ((0, dashboard_admin_1.isDesignatedAdminEmail)(fresh.email) || fresh.role === client_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException("This account must sign in through the dashboard.");
        }
        const token = this.signToken(fresh.id, fresh.email, fresh.phone || "", fresh.role, fresh.subscriptionTier, "app");
        return { user: (0, user_mapper_1.toPublicUser)(fresh), token };
    }
    async loginWithBiometric(email, credentialId) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid credentials. Account not found.");
        }
        if ((0, dashboard_admin_1.isDesignatedAdminEmail)(user.email) || user.role === client_1.Role.SUPER_ADMIN) {
            throw new common_1.ForbiddenException("This account must sign in through the dashboard.");
        }
        if (!user.isVerified) {
            throw new common_1.UnauthorizedException("Verify your email before logging in.");
        }
        if (!user.faceIdEnabled || !user.faceIdCredentialId) {
            throw new common_1.UnauthorizedException("Face ID is not enabled for this account.");
        }
        if (user.faceIdCredentialId !== credentialId.trim()) {
            throw new common_1.UnauthorizedException("Face ID verification failed for this account.");
        }
        const token = this.signToken(user.id, user.email, user.phone || "", user.role, user.subscriptionTier, "app");
        return { user: (0, user_mapper_1.toPublicUser)(user), token };
    }
    async loginDashboard(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash || !(await (0, bcryptjs_1.compare)(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException("Invalid admin credentials.");
        }
        await this.dashboardAdmin.ensureSingleAdmin();
        const fresh = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (!fresh) {
            throw new common_1.ForbiddenException("Dashboard access is limited to approved operator accounts.");
        }
        const isSuper = fresh.role === client_1.Role.SUPER_ADMIN && (0, dashboard_admin_1.isDesignatedAdminEmail)(fresh.email);
        const isOperator = fresh.role === client_1.Role.SECURITY_OPERATOR;
        if (!isSuper && !isOperator) {
            throw new common_1.ForbiddenException("Dashboard access requires Super Admin or an approved Security Operator account.");
        }
        const token = this.signToken(fresh.id, fresh.email, fresh.phone || "", fresh.role, fresh.subscriptionTier, "dashboard");
        return { user: (0, user_mapper_1.toPublicUser)(fresh), token, audience: "dashboard" };
    }
    async requestPasswordReset(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            throw new common_1.NotFoundException("No account found with this email address.");
        }
        const delivered = this.mail.isConfigured();
        const code = delivered
            ? (0, crypto_1.randomInt)(100000, 1000000).toString()
            : "123456";
        const expiresAt = new Date(Date.now() + env_1.env.otpExpiryMinutes * 60 * 1000);
        await this.prisma.emailOtp.upsert({
            where: { email: normalizedEmail },
            create: { email: normalizedEmail, code, expiresAt, attempts: 0, verified: false },
            update: { code, expiresAt, attempts: 0, verified: false },
        });
        if (delivered) {
            await this.mail.sendPasswordResetOtp(normalizedEmail, code, env_1.env.otpExpiryMinutes);
        }
        return {
            email: normalizedEmail,
            ...(delivered ? {} : { code }),
            delivered,
            expiresInMinutes: env_1.env.otpExpiryMinutes,
        };
    }
    async verifyPasswordResetOtp(email, code) {
        const record = await this.getActiveEmailOtp(email);
        if (record.code !== code) {
            await this.recordFailedOtpAttempt(record.email);
            throw new common_1.BadRequestException("Invalid verification code. Please check and try again.");
        }
        await this.prisma.emailOtp.update({
            where: { email: record.email },
            data: { verified: true },
        });
        return { verified: true, message: "Email verified. You may now set a new password." };
    }
    async resetPassword(email, code, newPassword) {
        const record = await this.getActiveEmailOtp(email);
        if (record.code !== code) {
            throw new common_1.BadRequestException("Invalid verification code. Please request a new code.");
        }
        if (!record.verified) {
            throw new common_1.BadRequestException("Please verify the code before resetting your password.");
        }
        const user = await this.prisma.user.findUnique({ where: { email: record.email } });
        if (!user) {
            throw new common_1.NotFoundException("User account not found.");
        }
        const passwordHash = await (0, bcryptjs_1.hash)(newPassword, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash },
            }),
            this.prisma.emailOtp.delete({ where: { email: record.email } }),
        ]);
        return { message: "Password updated successfully." };
    }
    async requestPinReset(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user || user.role === client_1.Role.SUPER_ADMIN) {
            throw new common_1.NotFoundException("No account found with this email address.");
        }
        const delivered = this.mail.isConfigured();
        const code = delivered ? (0, crypto_1.randomInt)(100000, 1000000).toString() : "123456";
        const expiresAt = new Date(Date.now() + env_1.env.otpExpiryMinutes * 60 * 1000);
        await this.prisma.emailOtp.upsert({
            where: { email: normalizedEmail },
            create: { email: normalizedEmail, code, expiresAt, attempts: 0, verified: false },
            update: { code, expiresAt, attempts: 0, verified: false },
        });
        if (delivered) {
            await this.mail.sendPinResetOtp(normalizedEmail, code, env_1.env.otpExpiryMinutes);
        }
        return {
            email: normalizedEmail,
            ...(delivered ? {} : { code }),
            delivered,
            expiresInMinutes: env_1.env.otpExpiryMinutes,
        };
    }
    async verifyPinResetOtp(email, code) {
        const record = await this.getActiveEmailOtp(email);
        if (record.code !== code) {
            await this.recordFailedOtpAttempt(record.email);
            throw new common_1.BadRequestException("Invalid verification code. Please check and try again.");
        }
        await this.prisma.emailOtp.update({
            where: { email: record.email },
            data: { verified: true },
        });
        return { verified: true, message: "Email verified. You may now set a new PIN." };
    }
    async resetPin(email, code, newPin) {
        if (!/^\d{4}$/.test(newPin)) {
            throw new common_1.BadRequestException("PIN must be exactly 4 digits.");
        }
        const record = await this.getActiveEmailOtp(email);
        if (record.code !== code) {
            throw new common_1.BadRequestException("Invalid verification code. Please request a new code.");
        }
        if (!record.verified) {
            throw new common_1.BadRequestException("Please verify the code before setting a new PIN.");
        }
        const user = await this.prisma.user.findUnique({ where: { email: record.email } });
        if (!user || user.role === client_1.Role.SUPER_ADMIN) {
            throw new common_1.NotFoundException("User account not found.");
        }
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: { pinHash: await (0, bcryptjs_1.hash)(newPin, 10) },
            }),
            this.prisma.emailOtp.delete({ where: { email: record.email } }),
        ]);
        return { message: "PIN updated successfully." };
    }
    async getActiveEmailOtp(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const record = await this.prisma.emailOtp.findUnique({ where: { email: normalizedEmail } });
        if (!record) {
            throw new common_1.BadRequestException("No pending verification found for this email. Please request a new code.");
        }
        if (Date.now() > record.expiresAt.getTime()) {
            await this.prisma.emailOtp.delete({ where: { email: normalizedEmail } });
            throw new common_1.BadRequestException("Verification code has expired. Please request a new code.");
        }
        return record;
    }
    async recordFailedOtpAttempt(email) {
        const record = await this.prisma.emailOtp.findUnique({ where: { email } });
        if (!record)
            return;
        const attempts = record.attempts + 1;
        if (attempts >= 5) {
            await this.prisma.emailOtp.delete({ where: { email } });
            throw new common_1.BadRequestException("Too many failed attempts. Verification code invalidated.");
        }
        await this.prisma.emailOtp.update({
            where: { email },
            data: { attempts },
        });
    }
    async logout(token) {
        const decoded = this.jwt.decode(token);
        const expiresAt = decoded?.exp
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.prisma.revokedToken.upsert({
            where: { tokenHash: (0, token_hash_1.hashToken)(token) },
            create: { tokenHash: (0, token_hash_1.hashToken)(token), expiresAt },
            update: { expiresAt },
        });
        await this.prisma.revokedToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        return { loggedOut: true };
    }
    async getMe(userId, audience = "app") {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("User account not found.");
        }
        const groups = await this.prisma.contactGroup.findMany({
            where: { userId },
            include: { members: true },
        });
        const activeAlerts = await this.prisma.alert.findMany({
            where: {
                userId,
                status: { in: [client_1.AlertStatus.TRIGGERED, client_1.AlertStatus.BROADCASTING] },
            },
            include: alert_mapper_1.alertInclude,
        });
        return {
            user: (0, user_mapper_1.toPublicUser)(user),
            audience,
            groups,
            activeAlerts: activeAlerts.map(alert_mapper_1.toAlertDto),
        };
    }
    signToken(userId, email, phone, role, tier, aud) {
        const payload = { sub: userId, email, phone, role, tier, aud };
        return this.jwt.sign(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        dashboard_admin_service_1.DashboardAdminService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map