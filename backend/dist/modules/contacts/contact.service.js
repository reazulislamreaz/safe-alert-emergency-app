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
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const phone_1 = require("../../common/utils/phone");
const contact_mapper_1 = require("../../common/mappers/contact.mapper");
const contact_constants_1 = require("./contact.constants");
const notification_service_1 = require("../notifications/notification.service");
const realtime_service_1 = require("../../realtime/realtime.service");
const mail_service_1 = require("../../mail/mail.service");
const contactInclude = {
    memberships: { include: { group: true }, orderBy: { groupId: "asc" } },
};
const groupInclude = {
    members: { orderBy: { name: "asc" } },
};
let ContactService = class ContactService {
    prisma;
    notifications;
    realtime;
    mail;
    constructor(prisma, notifications, realtime, mail) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.realtime = realtime;
        this.mail = mail;
    }
    getStatuses() {
        return { statuses: [...contact_constants_1.CONTACT_STATUSES] };
    }
    getColors() {
        return { colors: contact_constants_1.GROUP_COLORS.map((item) => ({ ...item })) };
    }
    async listContacts(userId, options = {}) {
        const excludeIds = await this.resolveExcludedIds(userId, options);
        const query = options.query?.trim();
        const digits = query ? (0, phone_1.digitsOnly)(query) : "";
        const contacts = await this.prisma.contact.findMany({
            where: {
                userId,
                ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
                ...(query
                    ? {
                        OR: [
                            { name: { contains: query, mode: "insensitive" } },
                            ...(digits.length ? [{ phoneDigits: { contains: digits } }] : []),
                        ],
                    }
                    : {}),
            },
            include: contactInclude,
            orderBy: { name: "asc" },
        });
        const plan = await this.getPlanUsage(userId);
        return {
            contacts: contacts.map(contact_mapper_1.toContactDto),
            plan,
            emptyState: contacts.length ? null : { ...contact_constants_1.CONTACTS_EMPTY },
        };
    }
    async suggestMembers(userId, groupId, query) {
        await this.requireGroup(userId, groupId);
        return this.listContacts(userId, { query, excludeGroupId: groupId });
    }
    async getContact(userId, contactId) {
        const contact = await this.requireContact(userId, contactId);
        return (0, contact_mapper_1.toContactDto)(contact);
    }
    async createContact(userId, dto) {
        const relationship = (dto.relationship || dto.status || "").trim();
        if (!relationship) {
            throw new common_1.BadRequestException("Status is required.");
        }
        let name = dto.name?.trim() || "";
        let phone = dto.phone?.trim() || "";
        let phoneDigits = phone ? (0, phone_1.digitsOnly)(phone) : "";
        if (dto.userId?.trim()) {
            const target = await this.prisma.user.findUnique({ where: { id: dto.userId.trim() } });
            if (!target || target.role !== client_1.Role.USER) {
                throw new common_1.BadRequestException("That user could not be found.");
            }
            if (!target.isVerified) {
                throw new common_1.BadRequestException("That user has not verified their email yet.");
            }
            if (target.id === userId) {
                throw new common_1.BadRequestException("You cannot add yourself as a contact.");
            }
            name = target.fullName.trim();
            phone = (target.phone || target.email).trim();
            phoneDigits = (0, phone_1.digitsOnly)(target.phone || "") || `uid-${target.id}`;
        }
        if (name.length < 2) {
            throw new common_1.BadRequestException("Select a registered user to add as a contact.");
        }
        if (!phoneDigits || phoneDigits.length < 3) {
            throw new common_1.BadRequestException("Selected user is missing contact details.");
        }
        const duplicate = await this.prisma.contact.findFirst({
            where: { userId, phoneDigits },
        });
        if (duplicate) {
            throw new common_1.BadRequestException("That person is already in your contacts.");
        }
        if (dto.groupId) {
            await this.assertCanAddMember(userId, dto.groupId, 1);
        }
        const contact = await this.prisma.$transaction(async (tx) => {
            const created = await tx.contact.create({
                data: {
                    id: `ct-${crypto.randomUUID().slice(0, 8)}`,
                    userId,
                    name,
                    phone,
                    phoneDigits,
                    relationship,
                },
            });
            if (dto.groupId) {
                await this.createMembership(tx, dto.groupId, created);
            }
            return tx.contact.findUniqueOrThrow({
                where: { id: created.id },
                include: contactInclude,
            });
        });
        const adder = await this.prisma.user.findUnique({ where: { id: userId } });
        if (adder) {
            await this.notifications.notifyContactAdded(adder.fullName.split(" ")[0], contact.phone, contact.id, userId);
        }
        return (0, contact_mapper_1.toContactDto)(contact);
    }
    async searchRegisteredUsers(userId, queryRaw) {
        const query = queryRaw.trim();
        if (query.length < 2) {
            return { users: [], query };
        }
        const existing = await this.prisma.contact.findMany({
            where: { userId },
            select: { phoneDigits: true, phone: true, name: true },
        });
        const existingDigits = new Set(existing.map((item) => item.phoneDigits));
        const existingPhones = new Set(existing.map((item) => item.phone.trim().toLowerCase()).filter(Boolean));
        const users = await this.prisma.user.findMany({
            where: {
                role: client_1.Role.USER,
                isVerified: true,
                id: { not: userId },
                OR: [
                    { fullName: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatar: true,
            },
            orderBy: { fullName: "asc" },
            take: 20,
        });
        return {
            query,
            users: users
                .filter((user) => {
                const digits = (0, phone_1.digitsOnly)(user.phone || "") || `uid-${user.id}`;
                if (existingDigits.has(digits))
                    return false;
                if (user.email && existingPhones.has(user.email.toLowerCase()))
                    return false;
                if (user.phone && existingPhones.has(user.phone.trim().toLowerCase()))
                    return false;
                return true;
            })
                .map((user) => ({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                initials: user.fullName
                    .split(" ")
                    .filter(Boolean)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")
                    .slice(0, 2),
            })),
        };
    }
    async updateContact(userId, contactId, dto) {
        const existing = await this.requireContact(userId, contactId);
        const relationship = (dto.relationship || dto.status || existing.relationship).trim();
        const phone = dto.phone?.trim() || existing.phone;
        const phoneDigits = (0, phone_1.digitsOnly)(phone);
        if (phoneDigits.length < 7) {
            throw new common_1.BadRequestException("Enter a valid phone number.");
        }
        if (phoneDigits !== existing.phoneDigits) {
            const duplicate = await this.prisma.contact.findFirst({
                where: { userId, phoneDigits, NOT: { id: contactId } },
            });
            if (duplicate) {
                throw new common_1.BadRequestException("A contact with this phone number already exists.");
            }
        }
        if (dto.groupId) {
            const alreadyInGroup = existing.memberships.some((m) => m.groupId === dto.groupId);
            if (!alreadyInGroup) {
                await this.assertCanAddMember(userId, dto.groupId, 1);
            }
        }
        const contact = await this.prisma.$transaction(async (tx) => {
            await tx.contact.update({
                where: { id: contactId },
                data: {
                    name: dto.name?.trim() || existing.name,
                    phone,
                    phoneDigits,
                    relationship,
                },
            });
            await tx.contactMember.updateMany({
                where: { contactId },
                data: {
                    name: dto.name?.trim() || existing.name,
                    phone,
                    relationship,
                },
            });
            if (dto.groupId && !existing.memberships.some((m) => m.groupId === dto.groupId)) {
                const updated = await tx.contact.findUniqueOrThrow({ where: { id: contactId } });
                await this.createMembership(tx, dto.groupId, updated);
            }
            return tx.contact.findUniqueOrThrow({
                where: { id: contactId },
                include: contactInclude,
            });
        });
        return (0, contact_mapper_1.toContactDto)(contact);
    }
    async deleteContact(userId, contactId) {
        await this.requireContact(userId, contactId);
        await this.prisma.$transaction(async (tx) => {
            const memberships = await tx.contactMember.findMany({ where: { contactId } });
            await tx.contactMember.deleteMany({ where: { contactId } });
            if (memberships.length) {
                const groupIds = [...new Set(memberships.map((membership) => membership.groupId))];
                await Promise.all(groupIds.map((groupId) => this.syncMemberCount(tx, groupId)));
            }
            await tx.contact.delete({ where: { id: contactId } });
        });
        return { deleted: true };
    }
    async getGroups(userId) {
        const plan = await this.getPlanUsage(userId);
        const groups = await this.prisma.contactGroup.findMany({
            where: { userId },
            include: groupInclude,
            orderBy: { name: "asc" },
        });
        const viewer = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { phoneDigits: true },
        });
        return {
            groups: groups.map((group) => this.toGroupWithPresence(group, plan.maxMembersPerGroup, userId, viewer?.phoneDigits ?? "")),
            plan,
            colors: contact_constants_1.GROUP_COLORS.map((item) => ({ ...item })),
            emptyState: groups.length ? null : { ...contact_constants_1.GROUPS_EMPTY },
        };
    }
    async getGroup(userId, groupId) {
        const plan = await this.getPlanUsage(userId);
        const group = await this.requireGroup(userId, groupId);
        return this.toGroupWithPresence(group, plan.maxMembersPerGroup, userId);
    }
    async createGroup(userId, dto) {
        const plan = await this.getPlanUsage(userId);
        if (!plan.canCreateGroup) {
            throw new common_1.ForbiddenException(plan.upgradeRequired
                ? "Add New Group (Upgrade Required)"
                : "You have reached the maximum number of groups for your plan.");
        }
        const memberIds = [...new Set(dto.memberIds ?? [])];
        this.assertMemberCap(memberIds.length, plan.maxMembersPerGroup);
        const contacts = await this.loadOwnedContacts(userId, memberIds);
        const inferredKind = dto.kind === "FAMILY_FRIENDS" || /family|friend/i.test(dto.name)
            ? client_1.ContactGroupKind.FAMILY_FRIENDS
            : client_1.ContactGroupKind.GENERAL;
        const group = await this.prisma.contactGroup.create({
            data: {
                id: `grp-${crypto.randomUUID().slice(0, 8)}`,
                userId,
                name: dto.name.trim(),
                color: dto.color || "#3A67D5",
                isDefaultSOS: true,
                kind: inferredKind,
                memberCount: contacts.length,
                members: {
                    create: contacts.map((contact) => ({
                        id: `mem-${crypto.randomUUID().slice(0, 8)}`,
                        contactId: contact.id,
                        name: contact.name,
                        phone: contact.phone,
                        phoneDigits: contact.phoneDigits,
                        relationship: contact.relationship,
                    })),
                },
            },
            include: groupInclude,
        });
        return this.toGroupWithPresence(group, plan.maxMembersPerGroup, userId);
    }
    async updateGroup(userId, groupId, dto) {
        const plan = await this.getPlanUsage(userId);
        const existing = await this.requireGroup(userId, groupId);
        if (dto.memberIds) {
            this.assertMemberCap(dto.memberIds.length, plan.maxMembersPerGroup);
            await this.loadOwnedContacts(userId, dto.memberIds);
        }
        const group = await this.prisma.$transaction(async (tx) => {
            if (dto.memberIds) {
                const nextIds = new Set(dto.memberIds);
                const currentByContact = new Map(existing.members
                    .filter((member) => member.contactId)
                    .map((member) => [member.contactId, member]));
                const toRemove = existing.members.filter((member) => !member.contactId || !nextIds.has(member.contactId));
                if (toRemove.length) {
                    await tx.contactMember.deleteMany({
                        where: { id: { in: toRemove.map((member) => member.id) } },
                    });
                }
                const toAdd = dto.memberIds.filter((id) => !currentByContact.has(id));
                if (toAdd.length) {
                    const contacts = await tx.contact.findMany({
                        where: { userId, id: { in: toAdd } },
                    });
                    await tx.contactMember.createMany({
                        data: contacts.map((contact) => ({
                            id: `mem-${crypto.randomUUID().slice(0, 8)}`,
                            groupId,
                            contactId: contact.id,
                            name: contact.name,
                            phone: contact.phone,
                            relationship: contact.relationship,
                        })),
                    });
                }
            }
            await tx.contactGroup.update({
                where: { id: groupId },
                data: {
                    ...(dto.name ? { name: dto.name.trim() } : {}),
                    ...(dto.color ? { color: dto.color } : {}),
                },
            });
            if (dto.memberIds) {
                await this.syncMemberCount(tx, groupId);
            }
            return tx.contactGroup.findUniqueOrThrow({
                where: { id: groupId },
                include: groupInclude,
            });
        });
        return this.toGroupWithPresence(group, plan.maxMembersPerGroup, userId);
    }
    async deleteGroup(userId, groupId) {
        await this.requireGroup(userId, groupId);
        await this.prisma.contactGroup.delete({ where: { id: groupId } });
        return { deleted: true };
    }
    async addMember(userId, groupId, dto) {
        const targetGroupId = dto.groupId || groupId;
        await this.assertCanAddMember(userId, targetGroupId, 1);
        const contactId = await this.resolveMemberContactId(userId, dto);
        const already = await this.prisma.contactMember.findFirst({
            where: { groupId: targetGroupId, contactId },
        });
        if (already) {
            throw new common_1.BadRequestException("This contact is already in the group.");
        }
        const contact = await this.prisma.contact.findUniqueOrThrow({ where: { id: contactId } });
        const member = await this.prisma.$transaction(async (tx) => {
            return this.createMembership(tx, targetGroupId, contact);
        });
        return (0, contact_mapper_1.toMemberDto)(member);
    }
    async deleteMember(userId, memberId) {
        const member = await this.prisma.contactMember.findUnique({
            where: { id: memberId },
            include: { group: true },
        });
        if (!member || member.group.userId !== userId) {
            throw new common_1.NotFoundException("Group member not found.");
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.contactMember.delete({ where: { id: memberId } });
            await this.syncMemberCount(tx, member.groupId);
        });
        return { deleted: true };
    }
    async inviteToGroup(userId, groupId, dto) {
        const group = await this.requireGroup(userId, groupId);
        const inviter = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const targets = [];
        const baseUrl = (process.env.APP_PUBLIC_URL || "https://safealert.app").replace(/\/$/, "");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (dto.contactId) {
            const contact = await this.requireContact(userId, dto.contactId);
            targets.push({ phone: contact.phone, name: contact.name });
        }
        else if (dto.phone) {
            targets.push({ phone: dto.phone, name: dto.phone });
        }
        else {
            for (const member of group.members) {
                targets.push({ phone: member.phone, name: member.name });
            }
        }
        const created = [];
        for (const target of targets) {
            const phoneDigits = (0, phone_1.digitsOnly)(target.phone);
            if (phoneDigits.length < 7 || phoneDigits === inviter.phoneDigits) {
                continue;
            }
            const existing = await this.prisma.groupInvitation.findFirst({
                where: { groupId, inviteePhoneDigits: phoneDigits, status: "PENDING" },
            });
            if (existing) {
                let token = existing.token;
                if (!token) {
                    token = `inv_${crypto.randomUUID().replace(/-/g, "")}`;
                    await this.prisma.groupInvitation.update({
                        where: { id: existing.id },
                        data: { token, expiresAt, maxUses: 1 },
                    });
                }
                created.push({ ...existing, token, expiresAt: existing.expiresAt ?? expiresAt });
                continue;
            }
            const invitee = await this.prisma.user.findFirst({ where: { phoneDigits } });
            const token = `inv_${crypto.randomUUID().replace(/-/g, "")}`;
            const invite = await this.prisma.groupInvitation.create({
                data: {
                    id: `inv-${crypto.randomUUID().slice(0, 8)}`,
                    groupId,
                    inviterId: userId,
                    inviteeUserId: invitee?.id,
                    inviteePhone: target.phone,
                    inviteePhoneDigits: phoneDigits,
                    inviteeName: target.name,
                    token,
                    expiresAt,
                    maxUses: 1,
                    useCount: 0,
                },
            });
            if (invitee) {
                await this.notifications.notifyGroupInvite({
                    inviteeUserId: invitee.id,
                    inviterName: inviter.fullName.split(" ")[0],
                    groupName: group.name,
                });
            }
            created.push(invite);
        }
        return {
            groupId,
            invited: created.length,
            invitations: created.map((invite) => {
                const shareUrl = invite.token ? `${baseUrl}/invite/${invite.token}` : null;
                return {
                    id: invite.id,
                    phone: invite.inviteePhone,
                    status: invite.status,
                    token: invite.token,
                    shareUrl,
                    shareText: shareUrl
                        ? `${inviter.fullName} invited you to join their Safety Circle (${group.name}). Download/sign up: ${shareUrl}`
                        : undefined,
                    expiresAt: invite.expiresAt?.toISOString?.() ?? invite.expiresAt?.toISOString?.() ?? null,
                };
            }),
        };
    }
    async resolveReferralToken(token) {
        const invite = await this.prisma.groupInvitation.findFirst({
            where: { token },
            include: {
                group: { select: { id: true, name: true } },
                inviter: { select: { fullName: true } },
            },
        });
        if (!invite) {
            return {
                status: "unavailable",
                message: "This invitation link is invalid or unavailable.",
                downloadUrl: process.env.APP_DOWNLOAD_URL || "https://safealert.app/download",
            };
        }
        if (invite.status === "ACCEPTED" || invite.useCount >= invite.maxUses) {
            return {
                status: "already_used",
                message: "This invitation has already been used.",
                groupName: invite.group.name,
                inviterName: invite.inviter.fullName.split(" ")[0],
                downloadUrl: process.env.APP_DOWNLOAD_URL || "https://safealert.app/download",
            };
        }
        if (invite.status === "DECLINED") {
            return {
                status: "unavailable",
                message: "This invitation is no longer available.",
                downloadUrl: process.env.APP_DOWNLOAD_URL || "https://safealert.app/download",
            };
        }
        if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
            return {
                status: "expired",
                message: "This invitation link has expired.",
                groupName: invite.group.name,
                inviterName: invite.inviter.fullName.split(" ")[0],
                downloadUrl: process.env.APP_DOWNLOAD_URL || "https://safealert.app/download",
            };
        }
        return {
            status: "valid",
            message: "Invitation is valid. Sign up or log in to join the Safety Circle.",
            token: invite.token,
            groupId: invite.group.id,
            groupName: invite.group.name,
            inviterName: invite.inviter.fullName.split(" ")[0],
            expiresAt: invite.expiresAt?.toISOString() ?? null,
            downloadUrl: process.env.APP_DOWNLOAD_URL || "https://safealert.app/download",
            signUpPath: `/create-account?invite=${invite.token}`,
        };
    }
    async claimReferralToken(userId, token) {
        const invite = await this.prisma.groupInvitation.findFirst({
            where: { token },
            include: { group: true },
        });
        if (!invite) {
            throw new common_1.NotFoundException("This invitation link is invalid or unavailable.");
        }
        if (invite.status === "DECLINED") {
            throw new common_1.BadRequestException("This invitation is no longer available.");
        }
        if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException("This invitation link has expired.");
        }
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const already = await this.prisma.contactMember.findFirst({
            where: { groupId: invite.groupId, phoneDigits: user.phoneDigits },
        });
        if (already) {
            return { id: invite.id, status: "ACCEPTED", groupId: invite.groupId, alreadyMember: true };
        }
        if (invite.useCount >= invite.maxUses && invite.status === "ACCEPTED") {
            throw new common_1.BadRequestException("This invitation has already been used.");
        }
        if (invite.useCount >= invite.maxUses) {
            throw new common_1.BadRequestException("This invitation has already been used.");
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.contactMember.create({
                data: {
                    id: `mem-${crypto.randomUUID().slice(0, 8)}`,
                    groupId: invite.groupId,
                    name: user.fullName,
                    phone: user.phone || "N/A",
                    phoneDigits: user.phoneDigits,
                    relationship: "Member",
                },
            });
            await this.syncMemberCount(tx, invite.groupId);
            const nextUseCount = invite.useCount + 1;
            await tx.groupInvitation.update({
                where: { id: invite.id },
                data: {
                    useCount: nextUseCount,
                    inviteeUserId: userId,
                    respondedAt: new Date(),
                    status: nextUseCount >= invite.maxUses ? "ACCEPTED" : "PENDING",
                },
            });
        });
        return { id: invite.id, status: "ACCEPTED", groupId: invite.groupId, alreadyMember: false };
    }
    async getReferral(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("User account not found.");
        }
        const baseUrl = (process.env.APP_PUBLIC_URL || "https://safealert.app").replace(/\/$/, "");
        let primaryGroup = await this.prisma.contactGroup.findFirst({
            where: { userId },
            orderBy: [{ isDefaultSOS: "desc" }, { name: "asc" }],
        });
        if (!primaryGroup) {
            primaryGroup = await this.prisma.contactGroup.create({
                data: {
                    id: `grp-${crypto.randomUUID().slice(0, 8)}`,
                    userId,
                    name: "My Safety Circle",
                    color: "#3A67D5",
                    isDefaultSOS: true,
                    memberCount: 0,
                },
            });
        }
        const existing = await this.prisma.groupInvitation.findFirst({
            where: {
                groupId: primaryGroup.id,
                inviterId: userId,
                inviteeName: "Referral link",
                status: "PENDING",
                useCount: { lt: 25 },
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            orderBy: { createdAt: "desc" },
        });
        let token;
        if (existing?.token) {
            token = existing.token;
        }
        else {
            const tokenValue = `inv_${crypto.randomUUID().replace(/-/g, "")}`;
            const invite = await this.prisma.groupInvitation.create({
                data: {
                    id: `inv-${crypto.randomUUID().slice(0, 8)}`,
                    groupId: primaryGroup.id,
                    inviterId: userId,
                    inviteePhone: "pending",
                    inviteePhoneDigits: `ref${Date.now()}`,
                    inviteeName: "Referral link",
                    token: tokenValue,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    maxUses: 25,
                    useCount: 0,
                },
            });
            token = invite.token;
        }
        const shareUrl = `${baseUrl}/invite/${token}`;
        return {
            title: contact_constants_1.REFERRAL_COPY.title,
            subtitle: contact_constants_1.REFERRAL_COPY.subtitle,
            shareUrl,
            shareText: `${user.fullName} invited you to Safety Circle. Join their safety circle: ${shareUrl}`,
            cta: contact_constants_1.REFERRAL_COPY.cta,
            token,
            groupId: primaryGroup.id,
            channels: ["text", "email", "share_sheet"],
            downloadUrl: process.env.APP_DOWNLOAD_URL || "https://safealert.app/download",
            deepLinkPath: `/invite/${token}`,
            signUpPath: `/create-account?invite=${token}`,
        };
    }
    async sendReferralEmail(userId, toEmail) {
        const email = toEmail.trim().toLowerCase();
        if (!email.includes("@")) {
            throw new common_1.BadRequestException("Enter a valid email address.");
        }
        const referral = await this.getReferral(userId);
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        if (!this.mail.isConfigured()) {
            return {
                delivered: false,
                shareUrl: referral.shareUrl,
                message: "Email is not configured. Share the link manually via SMS or share sheet.",
            };
        }
        await this.mail.sendMail({
            to: email,
            subject: `${user.fullName.split(" ")[0]} invited you to Safety Circle`,
            text: `${user.fullName} invited you to join their Safety Circle.\n\nOpen this link to download/sign up and join:\n${referral.shareUrl}`,
            html: `<p><strong>${user.fullName}</strong> invited you to join their Safety Circle.</p><p><a href="${referral.shareUrl}">Join Safety Circle</a></p>`,
        });
        return { delivered: true, shareUrl: referral.shareUrl, channel: "email" };
    }
    async sendReferralSms(userId, toPhone) {
        const phone = toPhone.trim();
        if ((0, phone_1.digitsOnly)(phone).length < 7) {
            throw new common_1.BadRequestException("Enter a valid phone number.");
        }
        const referral = await this.getReferral(userId);
        const smsUrl = process.env.SMS_WEBHOOK_URL?.trim();
        if (!smsUrl) {
            return {
                delivered: false,
                shareUrl: referral.shareUrl,
                shareText: referral.shareText,
                message: "SMS webhook is not configured. Share the link manually.",
            };
        }
        const response = await fetch(smsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: phone, body: referral.shareText, from: "Safety Circle" }),
        });
        if (!response.ok) {
            throw new common_1.BadRequestException("Failed to send SMS invitation. Try sharing the link manually.");
        }
        return { delivered: true, shareUrl: referral.shareUrl, channel: "sms" };
    }
    async listInvitations(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const items = await this.prisma.groupInvitation.findMany({
            where: {
                status: "PENDING",
                OR: [{ inviteeUserId: userId }, { inviteePhoneDigits: user.phoneDigits }],
            },
            include: { group: true, inviter: { select: { fullName: true } } },
            orderBy: { createdAt: "desc" },
        });
        return {
            title: "Join an Emergency Group",
            subtitle: "please ! Accept or Reject the pending invitation",
            skipLabel: "Skip for now — join a group later",
            acceptLabel: "Accept & Join",
            declineLabel: "Decline",
            items: items.map((invite) => ({
                id: invite.id,
                groupId: invite.groupId,
                groupName: invite.group.name,
                invitedBy: `Invited by ${invite.inviter.fullName}`,
                createdAt: invite.createdAt.toISOString(),
            })),
        };
    }
    async acceptInvitation(userId, invitationId) {
        return this.respondToInvitation(userId, invitationId, "ACCEPTED");
    }
    async declineInvitation(userId, invitationId) {
        return this.respondToInvitation(userId, invitationId, "DECLINED");
    }
    async respondToInvitation(userId, invitationId, status) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const invite = await this.prisma.groupInvitation.findFirst({
            where: {
                id: invitationId,
                status: "PENDING",
                OR: [{ inviteeUserId: userId }, { inviteePhoneDigits: user.phoneDigits }],
            },
            include: { group: true },
        });
        if (!invite) {
            throw new common_1.NotFoundException("Invitation not found.");
        }
        if (status === "ACCEPTED") {
            const already = await this.prisma.contactMember.findFirst({
                where: { groupId: invite.groupId, phoneDigits: user.phoneDigits },
            });
            if (!already) {
                await this.prisma.$transaction(async (tx) => {
                    await tx.contactMember.create({
                        data: {
                            id: `mem-${crypto.randomUUID().slice(0, 8)}`,
                            groupId: invite.groupId,
                            name: user.fullName,
                            phone: user.phone || "N/A",
                            phoneDigits: user.phoneDigits,
                            relationship: "Member",
                        },
                    });
                    await this.syncMemberCount(tx, invite.groupId);
                });
            }
        }
        const updated = await this.prisma.groupInvitation.update({
            where: { id: invite.id },
            data: {
                status,
                respondedAt: new Date(),
                inviteeUserId: userId,
                ...(status === "ACCEPTED" ? { useCount: { increment: 1 } } : {}),
            },
        });
        return { id: updated.id, status: updated.status, groupId: updated.groupId };
    }
    async getPlanUsage(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("User account not found.");
        }
        const planId = user.subscriptionTier === client_1.SubscriptionTier.PREMIUM ? "plan-pro" : "plan-free";
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        const maxGroups = plan?.maxGroups ?? 2;
        const maxMembersPerGroup = plan?.maxContacts ?? 5;
        const groupCount = await this.prisma.contactGroup.count({ where: { userId } });
        const unlimitedGroups = maxGroups === 0;
        const canCreateGroup = unlimitedGroups || groupCount < maxGroups;
        const isFree = user.subscriptionTier === client_1.SubscriptionTier.FREE;
        return {
            tier: user.subscriptionTier,
            name: isFree ? "FREE PLAN" : "PREMIUM PLAN",
            groupCount,
            maxGroups,
            maxMembersPerGroup,
            canCreateGroup,
            upgradeRequired: isFree && !canCreateGroup,
            usageLabel: unlimitedGroups
                ? `${isFree ? "FREE PLAN" : "PREMIUM PLAN"} — ${groupCount} groups`
                : `${isFree ? "FREE PLAN" : "PREMIUM PLAN"} — ${groupCount}/${maxGroups} groups`,
            banner: isFree
                ? `Free plan: max ${maxGroups} groups, ${maxMembersPerGroup} members each`
                : null,
            upgradeCta: "Upgrade",
            addGroupCta: canCreateGroup ? "+ Add New Group" : "+ Add New Group (Upgrade Required)",
        };
    }
    toGroupWithPresence(group, maxMembersPerGroup, userId, phoneDigits) {
        const viewerPhone = phoneDigits ?? "";
        const memberOnline = group.members.filter((member) => this.realtime.isPhoneOnline(member.phoneDigits)).length;
        const ownerCounted = group.userId === userId &&
            this.realtime.isUserOnline(userId) &&
            !group.members.some((member) => member.phoneDigits === viewerPhone);
        const onlineCount = memberOnline + (ownerCounted ? 1 : 0);
        return {
            ...(0, contact_mapper_1.toGroupDto)(group, maxMembersPerGroup, onlineCount),
            members: group.members.map((member) => (0, contact_mapper_1.toMemberDto)(member, this.realtime.isPhoneOnline(member.phoneDigits))),
        };
    }
    async requireContact(userId, contactId) {
        const contact = await this.prisma.contact.findFirst({
            where: { id: contactId, userId },
            include: contactInclude,
        });
        if (!contact) {
            throw new common_1.NotFoundException("Contact not found.");
        }
        return contact;
    }
    async requireGroup(userId, groupId) {
        const group = await this.prisma.contactGroup.findFirst({
            where: { id: groupId, userId },
            include: groupInclude,
        });
        if (!group) {
            throw new common_1.NotFoundException("Group not found.");
        }
        return group;
    }
    async loadOwnedContacts(userId, ids) {
        if (!ids.length) {
            return [];
        }
        const uniqueIds = [...new Set(ids)];
        const contacts = await this.prisma.contact.findMany({
            where: { userId, id: { in: uniqueIds } },
        });
        if (contacts.length !== uniqueIds.length) {
            throw new common_1.BadRequestException("One or more contacts were not found in your address book.");
        }
        return contacts;
    }
    async assertCanAddMember(userId, groupId, additional) {
        const plan = await this.getPlanUsage(userId);
        await this.requireGroup(userId, groupId);
        const memberCount = await this.prisma.contactMember.count({ where: { groupId } });
        this.assertMemberCap(memberCount + additional, plan.maxMembersPerGroup);
    }
    assertMemberCap(count, maxMembersPerGroup) {
        if (maxMembersPerGroup !== 0 && count > maxMembersPerGroup) {
            throw new common_1.ForbiddenException(`This plan allows up to ${maxMembersPerGroup} members per group.`);
        }
    }
    async createMembership(tx, groupId, contact) {
        const member = await tx.contactMember.create({
            data: {
                id: `mem-${crypto.randomUUID().slice(0, 8)}`,
                groupId,
                contactId: contact.id,
                name: contact.name,
                phone: contact.phone,
                phoneDigits: (0, phone_1.digitsOnly)(contact.phone),
                relationship: contact.relationship,
            },
        });
        await this.syncMemberCount(tx, groupId);
        return member;
    }
    async syncMemberCount(tx, groupId) {
        const memberCount = await tx.contactMember.count({ where: { groupId } });
        await tx.contactGroup.update({
            where: { id: groupId },
            data: { memberCount },
        });
    }
    async resolveExcludedIds(userId, options) {
        const excludeIds = new Set(options.excludeIds?.filter(Boolean) ?? []);
        if (options.excludeGroupId) {
            const owned = await this.prisma.contactGroup.findFirst({
                where: { id: options.excludeGroupId, userId },
                select: { id: true },
            });
            if (!owned) {
                return [...excludeIds];
            }
            const members = await this.prisma.contactMember.findMany({
                where: { groupId: options.excludeGroupId, contactId: { not: null } },
                select: { contactId: true },
            });
            for (const member of members) {
                if (member.contactId) {
                    excludeIds.add(member.contactId);
                }
            }
        }
        return [...excludeIds];
    }
    async resolveMemberContactId(userId, dto) {
        if (dto.contactId) {
            await this.requireContact(userId, dto.contactId);
            return dto.contactId;
        }
        if (dto.name && dto.phone) {
            const created = await this.createContact(userId, {
                name: dto.name,
                phone: dto.phone,
                relationship: dto.relationship || "Contact",
            });
            return created.id;
        }
        const typedName = dto.name?.trim();
        if (typedName) {
            const matches = await this.prisma.contact.findMany({
                where: {
                    userId,
                    name: { contains: typedName, mode: "insensitive" },
                },
                orderBy: { name: "asc" },
            });
            if (matches.length === 1) {
                return matches[0].id;
            }
            if (matches.length > 1) {
                throw new common_1.BadRequestException("Multiple contacts match that name. Pick one from suggested contacts.");
            }
            throw new common_1.BadRequestException("No matching contact. Add them from All Contacts first.");
        }
        throw new common_1.BadRequestException("Provide a contactId or a name and phone number.");
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService,
        realtime_service_1.RealtimeService,
        mail_service_1.MailService])
], ContactService);
//# sourceMappingURL=contact.service.js.map