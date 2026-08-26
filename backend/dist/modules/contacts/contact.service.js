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
const contactInclude = {
    memberships: { include: { group: true }, orderBy: { groupId: "asc" } },
};
const groupInclude = {
    members: { orderBy: { name: "asc" } },
};
let ContactService = class ContactService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getStatuses() {
        return { statuses: [...contact_constants_1.CONTACT_STATUSES] };
    }
    async listContacts(userId, options = {}) {
        const excludeIds = await this.resolveExcludedIds(options);
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
        const phoneDigits = (0, phone_1.digitsOnly)(dto.phone);
        if (phoneDigits.length < 7) {
            throw new common_1.BadRequestException("Enter a valid phone number.");
        }
        const duplicate = await this.prisma.contact.findFirst({
            where: { userId, phoneDigits },
        });
        if (duplicate) {
            throw new common_1.BadRequestException("A contact with this phone number already exists.");
        }
        if (dto.groupId) {
            await this.assertCanAddMember(userId, dto.groupId, 1);
        }
        const contact = await this.prisma.$transaction(async (tx) => {
            const created = await tx.contact.create({
                data: {
                    id: `ct-${crypto.randomUUID().slice(0, 8)}`,
                    userId,
                    name: dto.name.trim(),
                    phone: dto.phone.trim(),
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
        return (0, contact_mapper_1.toContactDto)(contact);
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
        return {
            groups: groups.map((group) => (0, contact_mapper_1.toGroupDto)(group, plan.maxMembersPerGroup)),
            plan,
        };
    }
    async getGroup(userId, groupId) {
        const plan = await this.getPlanUsage(userId);
        const group = await this.requireGroup(userId, groupId);
        return (0, contact_mapper_1.toGroupDto)(group, plan.maxMembersPerGroup);
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
        const group = await this.prisma.contactGroup.create({
            data: {
                id: `grp-${crypto.randomUUID().slice(0, 8)}`,
                userId,
                name: dto.name.trim(),
                color: dto.color || "#3A67D5",
                isDefaultSOS: true,
                memberCount: contacts.length,
                members: {
                    create: contacts.map((contact) => ({
                        id: `mem-${crypto.randomUUID().slice(0, 8)}`,
                        contactId: contact.id,
                        name: contact.name,
                        phone: contact.phone,
                        relationship: contact.relationship,
                    })),
                },
            },
            include: groupInclude,
        });
        return (0, contact_mapper_1.toGroupDto)(group, plan.maxMembersPerGroup);
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
        return (0, contact_mapper_1.toGroupDto)(group, plan.maxMembersPerGroup);
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
    async getReferral(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException("User account not found.");
        }
        const shareUrl = `https://safealert.app/invite/${user.id}`;
        return {
            title: contact_constants_1.REFERRAL_COPY.title,
            subtitle: contact_constants_1.REFERRAL_COPY.subtitle,
            shareUrl,
            shareText: `${user.fullName} invited you to SafeAlert. Join their safety circle: ${shareUrl}`,
            cta: contact_constants_1.REFERRAL_COPY.cta,
        };
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
    async resolveExcludedIds(options) {
        const excludeIds = new Set(options.excludeIds?.filter(Boolean) ?? []);
        if (options.excludeGroupId) {
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContactService);
//# sourceMappingURL=contact.service.js.map