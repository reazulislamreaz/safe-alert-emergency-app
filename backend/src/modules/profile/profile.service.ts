import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SubscriptionTier, User } from "@prisma/client";
import { compare } from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { digitsOnly, maskPhone } from "../../common/utils/phone";
import { hashToken } from "../../common/utils/token-hash";
import { toPublicUser } from "../../common/mappers/user.mapper";
import {
  LEGAL_PAGES,
  PLAN_CATALOG,
  PROFILE_COPY,
  PROFILE_MENU,
  PROFILE_PHOTO_LIMIT,
  SUBSCRIPTION_COPY,
} from "./profile.constants";
import { CancelSubscriptionDto, SubscribeDto, UpdateProfileDto } from "./dto/profile.dto";
import { requireStoredImageUrls } from "../uploads/uploads.constants";
import { UploadsService } from "../uploads/uploads.service";

const MS_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly uploads: UploadsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.requireUser(userId);
    const photos = user.profilePhotos ?? [];
    return {
      user: this.toProfileUser(user),
      menu: PROFILE_MENU.map((item) => ({ ...item })),
      actions: {
        edit: PROFILE_COPY.editCta,
        update: PROFILE_COPY.updateCta,
        logout: PROFILE_COPY.logoutCta,
        deleteAccount: PROFILE_COPY.deleteAccountCta,
      },
      photos: {
        items: photos,
        count: photos.length,
        required: PROFILE_PHOTO_LIMIT,
        label: `${photos.length}/${PROFILE_PHOTO_LIMIT} required`,
      },
      prompts: {
        logout: PROFILE_COPY.logoutPrompt,
        deleteAccount: PROFILE_COPY.deletePrompt,
      },
      subscription: this.toSubscriptionPayload(user),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.requireUser(userId);

    if (dto.email) {
      const email = dto.email.toLowerCase();
      const taken = await this.prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (taken) {
        throw new BadRequestException("An account with this email already exists.");
      }
    }

    if (dto.phone) {
      const phoneDigits = digitsOnly(dto.phone);
      if (phoneDigits.length < 7) {
        throw new BadRequestException("Enter a valid phone number.");
      }
      const taken = await this.prisma.user.findFirst({
        where: { phoneDigits, NOT: { id: userId } },
      });
      if (taken) {
        throw new BadRequestException("An account with this phone number already exists.");
      }
    }

    const photos = requireStoredImageUrls(dto.profilePhotos);
    if (photos && photos.filter(Boolean).length > PROFILE_PHOTO_LIMIT) {
      throw new BadRequestException(`You can add up to ${PROFILE_PHOTO_LIMIT} profile photos.`);
    }

    const nextPhotos = photos?.filter(Boolean);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.dob !== undefined ? { dob: dto.dob } : {}),
        ...(dto.email ? { email: dto.email.toLowerCase() } : {}),
        ...(dto.phone
          ? { phone: dto.phone.trim(), phoneDigits: digitsOnly(dto.phone) }
          : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.race !== undefined ? { race: dto.race } : {}),
        ...(dto.emergencyContactName ? { emergencyContactName: dto.emergencyContactName.trim() } : {}),
        ...(dto.emergencyContactPhone !== undefined
          ? { emergencyContactPhone: dto.emergencyContactPhone }
          : {}),
        ...(dto.emergencyContactRelation !== undefined
          ? { emergencyContactRelation: dto.emergencyContactRelation }
          : {}),
        ...(nextPhotos ? { profilePhotos: nextPhotos, avatar: dto.avatar || nextPhotos[0] || user.avatar } : {}),
        ...(dto.avatar && !nextPhotos ? { avatar: dto.avatar } : {}),
      },
    });

    return {
      ...(await this.getProfile(updated.id)),
      token: this.tokenFor(updated),
    };
  }

  async updatePhotos(userId: string, photos: string[]) {
    const cleaned = requireStoredImageUrls(photos)?.slice(0, PROFILE_PHOTO_LIMIT) ?? [];
    return this.updateProfile(userId, { profilePhotos: cleaned, avatar: cleaned[0] });
  }

  async updatePhotosFromFiles(userId: string, files: Express.Multer.File[]) {
    const stored = await this.uploads.uploadFiles(files ?? [], userId);
    return this.updatePhotos(userId, stored.map((item) => item.url));
  }

  async deleteAccount(userId: string, pin: string, accessToken?: string) {
    const user = await this.requireUser(userId);
    if (!user.pinHash || !(await compare(pin, user.pinHash))) {
      throw new UnauthorizedException("Incorrect PIN.");
    }

    if (accessToken) {
      const decoded = this.jwt.decode(accessToken) as { exp?: number } | null;
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.prisma.revokedToken.upsert({
        where: { tokenHash: hashToken(accessToken) },
        create: { tokenHash: hashToken(accessToken), expiresAt },
        update: { expiresAt },
      });
    }

    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }

  async getPlans(userId: string) {
    const user = await this.requireUser(userId);
    return {
      copy: {
        title: SUBSCRIPTION_COPY.choosePlan,
        trialNote: SUBSCRIPTION_COPY.trialNote,
      },
      currentTier: user.subscriptionTier,
      plans: [this.toPlanCard("FREE", user), this.toPlanCard("PREMIUM", user)],
    };
  }

  async getCurrentSubscription(userId: string) {
    const user = await this.requireUser(userId);
    return this.toSubscriptionPayload(user);
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const user = await this.requireUser(userId);
    const planId = dto.planId || PLAN_CATALOG.PREMIUM.id;
    if (planId !== PLAN_CATALOG.PREMIUM.id) {
      throw new BadRequestException("Only the Premium plan can be purchased.");
    }
    if (user.subscriptionTier === SubscriptionTier.PREMIUM) {
      throw new BadRequestException("You already have an active Premium plan.");
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * MS_DAY);
    const renewsAt = new Date(now.getTime() + 30 * MS_DAY);

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: SubscriptionTier.PREMIUM,
          subscriptionStartedAt: now,
          subscriptionRenewsAt: renewsAt,
          subscriptionCancelledAt: null,
          subscriptionCancelReason: null,
          trialEndsAt,
        },
      });
      await tx.subscriptionPlan.update({
        where: { id: PLAN_CATALOG.PREMIUM.id },
        data: { subscriberCount: { increment: 1 } },
      });
      if (user.subscriptionTier === SubscriptionTier.FREE) {
        await tx.subscriptionPlan.update({
          where: { id: PLAN_CATALOG.FREE.id },
          data: { subscriberCount: { decrement: 1 } },
        });
      }
      return next;
    });

    return {
      ...this.toSubscriptionPayload(updated),
      token: this.tokenFor(updated),
    };
  }

  async cancel(userId: string, dto: CancelSubscriptionDto) {
    const user = await this.requireUser(userId);
    if (user.subscriptionTier !== SubscriptionTier.PREMIUM) {
      throw new ForbiddenException("You're on the Free plan.");
    }

    const comments = (dto.comments || dto.reason || dto.feedback || "").trim();
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: SubscriptionTier.FREE,
          subscriptionCancelledAt: now,
          subscriptionCancelReason: comments || null,
          subscriptionRenewsAt: null,
          trialEndsAt: null,
        },
      });
      await tx.subscriptionPlan.update({
        where: { id: PLAN_CATALOG.PREMIUM.id },
        data: { subscriberCount: { decrement: 1 } },
      });
      await tx.subscriptionPlan.update({
        where: { id: PLAN_CATALOG.FREE.id },
        data: { subscriberCount: { increment: 1 } },
      });
      return next;
    });

    return {
      ...this.toSubscriptionPayload(updated),
      token: this.tokenFor(updated),
    };
  }

  async listLegal() {
    const pages = await this.prisma.legalPage.findMany({ orderBy: { title: "asc" } });
    if (pages.length) {
      return pages.map((page) => ({
        slug: page.slug,
        title: page.title,
        body: page.body,
        updatedAt: page.updatedAt.toISOString(),
      }));
    }
    return LEGAL_PAGES.map((page) => ({ ...page, updatedAt: null }));
  }

  async getLegal(slug: string) {
    const page = await this.prisma.legalPage.findUnique({ where: { slug } });
    if (page) {
      return {
        slug: page.slug,
        title: page.title,
        body: page.body,
        updatedAt: page.updatedAt.toISOString(),
      };
    }
    const fallback = LEGAL_PAGES.find((item) => item.slug === slug);
    if (!fallback) {
      throw new NotFoundException("Page not found.");
    }
    return { ...fallback, updatedAt: null };
  }

  private tokenFor(user: User) {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tier: user.subscriptionTier,
    });
  }

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User account not found.");
    }
    return user;
  }

  private toProfileUser(user: User) {
    const photos = user.profilePhotos ?? [];
    return {
      ...toPublicUser(user),
      phoneMasked: maskPhone(user.phone || ""),
      address: user.location,
      photoCount: photos.length,
      photoRequired: PROFILE_PHOTO_LIMIT,
      photoLabel: `${photos.length}/${PROFILE_PHOTO_LIMIT} required`,
      emergencyContact: {
        name: user.emergencyContactName,
        phone: user.emergencyContactPhone,
        relation: user.emergencyContactRelation,
        label: [user.emergencyContactName, user.emergencyContactRelation].filter(Boolean).join(" — "),
      },
    };
  }

  private toSubscriptionPayload(user: User) {
    const current = this.toPlanCard(
      user.subscriptionTier === SubscriptionTier.PREMIUM ? "PREMIUM" : "FREE",
      user,
    );
    const other = this.toPlanCard(
      user.subscriptionTier === SubscriptionTier.PREMIUM ? "FREE" : "PREMIUM",
      user,
    );
    const cancelled = Boolean(user.subscriptionCancelledAt) && user.subscriptionTier === SubscriptionTier.FREE;
    const inTrial = Boolean(user.trialEndsAt && user.trialEndsAt > new Date() && user.subscriptionTier === SubscriptionTier.PREMIUM);

    return {
      copy: SUBSCRIPTION_COPY,
      status: cancelled ? "CANCELLED" : inTrial ? "TRIAL" : "ACTIVE",
      tier: user.subscriptionTier,
      canUpgrade: user.subscriptionTier === SubscriptionTier.FREE,
      canCancel: user.subscriptionTier === SubscriptionTier.PREMIUM,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
      renewsAt: user.subscriptionRenewsAt?.toISOString() ?? null,
      startedAt: user.subscriptionStartedAt?.toISOString() ?? null,
      cancelledAt: user.subscriptionCancelledAt?.toISOString() ?? null,
      currentPlan: {
        ...current,
        badge: cancelled ? SUBSCRIPTION_COPY.cancelledBadge : null,
        section: SUBSCRIPTION_COPY.currentPlan,
      },
      switchPlan: {
        ...other,
        section: SUBSCRIPTION_COPY.switchPlan,
      },
      plans: [current, other],
    };
  }

  private toPlanCard(tier: "FREE" | "PREMIUM", user: User) {
    const catalog = PLAN_CATALOG[tier];
    return {
      id: catalog.id,
      tier: catalog.tier,
      name: catalog.name,
      price: catalog.price,
      priceLabel: catalog.priceLabel,
      pricePeriod: catalog.pricePeriod,
      features: catalog.features.map((feature) => ({ ...feature })),
      isCurrent: user.subscriptionTier === catalog.tier,
    };
  }
}
