import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role, SubscriptionTier } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { digitsOnly } from "../../common/utils/phone";
import { toContactDto, toGroupDto, toMemberDto } from "../../common/mappers/contact.mapper";
import { AddMemberDto, CreateContactDto, CreateGroupDto, UpdateContactDto, UpdateGroupDto } from "./dto/contact.dto";
import { CONTACT_STATUSES, CONTACTS_EMPTY, GROUPS_EMPTY, GROUP_COLORS, REFERRAL_COPY } from "./contact.constants";
import { NotificationService } from "../notifications/notification.service";
import { RealtimeService } from "../../realtime/realtime.service";

export type ListContactsOptions = {
  query?: string;
  excludeGroupId?: string;
  excludeIds?: string[];
};

const contactInclude = {
  memberships: { include: { group: true }, orderBy: { groupId: "asc" as const } },
} satisfies Prisma.ContactInclude;

const groupInclude = {
  members: { orderBy: { name: "asc" as const } },
};

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly realtime: RealtimeService,
  ) {}

  getStatuses() {
    return { statuses: [...CONTACT_STATUSES] };
  }

  getColors() {
    return { colors: GROUP_COLORS.map((item) => ({ ...item })) };
  }

  async listContacts(userId: string, options: ListContactsOptions = {}) {
    const excludeIds = await this.resolveExcludedIds(userId, options);
    const query = options.query?.trim();
    const digits = query ? digitsOnly(query) : "";

    const contacts = await this.prisma.contact.findMany({
      where: {
        userId,
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
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
      contacts: contacts.map(toContactDto),
      plan,
      emptyState: contacts.length ? null : { ...CONTACTS_EMPTY },
    };
  }

  async suggestMembers(userId: string, groupId: string, query?: string) {
    await this.requireGroup(userId, groupId);
    return this.listContacts(userId, { query, excludeGroupId: groupId });
  }

  async getContact(userId: string, contactId: string) {
    const contact = await this.requireContact(userId, contactId);
    return toContactDto(contact);
  }

  async createContact(userId: string, dto: CreateContactDto) {
    const relationship = (dto.relationship || dto.status || "").trim();
    if (!relationship) {
      throw new BadRequestException("Status is required.");
    }

    let name = dto.name?.trim() || "";
    let phone = dto.phone?.trim() || "";
    let phoneDigits = phone ? digitsOnly(phone) : "";

    if (dto.userId?.trim()) {
      const target = await this.prisma.user.findUnique({ where: { id: dto.userId.trim() } });
      if (!target || target.role !== Role.USER) {
        throw new BadRequestException("That user could not be found.");
      }
      if (!target.isVerified) {
        throw new BadRequestException("That user has not verified their email yet.");
      }
      if (target.id === userId) {
        throw new BadRequestException("You cannot add yourself as a contact.");
      }

      name = target.fullName.trim();
      phone = (target.phone || target.email).trim();
      phoneDigits = digitsOnly(target.phone || "") || `uid-${target.id}`;
    }

    if (name.length < 2) {
      throw new BadRequestException("Select a registered user to add as a contact.");
    }
    if (!phoneDigits || phoneDigits.length < 3) {
      throw new BadRequestException("Selected user is missing contact details.");
    }

    const duplicate = await this.prisma.contact.findFirst({
      where: { userId, phoneDigits },
    });
    if (duplicate) {
      throw new BadRequestException("That person is already in your contacts.");
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
      await this.notifications.notifyContactAdded(
        adder.fullName.split(" ")[0],
        contact.phone,
        contact.id,
        userId,
      );
    }

    return toContactDto(contact);
  }

  async searchRegisteredUsers(userId: string, queryRaw: string) {
    const query = queryRaw.trim();
    if (query.length < 2) {
      return { users: [], query };
    }

    const existing = await this.prisma.contact.findMany({
      where: { userId },
      select: { phoneDigits: true, phone: true, name: true },
    });
    const existingDigits = new Set(existing.map((item) => item.phoneDigits));
    const existingPhones = new Set(
      existing.map((item) => item.phone.trim().toLowerCase()).filter(Boolean),
    );

    const users = await this.prisma.user.findMany({
      where: {
        role: Role.USER,
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
          const digits = digitsOnly(user.phone || "") || `uid-${user.id}`;
          if (existingDigits.has(digits)) return false;
          if (user.email && existingPhones.has(user.email.toLowerCase())) return false;
          if (user.phone && existingPhones.has(user.phone.trim().toLowerCase())) return false;
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

  async updateContact(userId: string, contactId: string, dto: UpdateContactDto) {
    const existing = await this.requireContact(userId, contactId);
    const relationship = (dto.relationship || dto.status || existing.relationship).trim();
    const phone = dto.phone?.trim() || existing.phone;
    const phoneDigits = digitsOnly(phone);

    if (phoneDigits.length < 7) {
      throw new BadRequestException("Enter a valid phone number.");
    }

    if (phoneDigits !== existing.phoneDigits) {
      const duplicate = await this.prisma.contact.findFirst({
        where: { userId, phoneDigits, NOT: { id: contactId } },
      });
      if (duplicate) {
        throw new BadRequestException("A contact with this phone number already exists.");
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

    return toContactDto(contact);
  }

  async deleteContact(userId: string, contactId: string) {
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

  async getGroups(userId: string) {
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
      groups: groups.map((group) =>
        this.toGroupWithPresence(group, plan.maxMembersPerGroup, userId, viewer?.phoneDigits ?? ""),
      ),
      plan,
      colors: GROUP_COLORS.map((item) => ({ ...item })),
      emptyState: groups.length ? null : { ...GROUPS_EMPTY },
    };
  }

  async getGroup(userId: string, groupId: string) {
    const plan = await this.getPlanUsage(userId);
    const group = await this.requireGroup(userId, groupId);
    return this.toGroupWithPresence(group, plan.maxMembersPerGroup, userId);
  }

  async createGroup(userId: string, dto: CreateGroupDto) {
    const plan = await this.getPlanUsage(userId);
    if (!plan.canCreateGroup) {
      throw new ForbiddenException(
        plan.upgradeRequired
          ? "Add New Group (Upgrade Required)"
          : "You have reached the maximum number of groups for your plan.",
      );
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

    return this.toGroupWithPresence(group, plan.maxMembersPerGroup, userId);
  }

  async updateGroup(userId: string, groupId: string, dto: UpdateGroupDto) {
    const plan = await this.getPlanUsage(userId);
    const existing = await this.requireGroup(userId, groupId);

    if (dto.memberIds) {
      this.assertMemberCap(dto.memberIds.length, plan.maxMembersPerGroup);
      await this.loadOwnedContacts(userId, dto.memberIds);
    }

    const group = await this.prisma.$transaction(async (tx) => {
      if (dto.memberIds) {
        const nextIds = new Set(dto.memberIds);
        const currentByContact = new Map(
          existing.members
            .filter((member) => member.contactId)
            .map((member) => [member.contactId as string, member]),
        );

        const toRemove = existing.members.filter(
          (member) => !member.contactId || !nextIds.has(member.contactId),
        );
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

  async deleteGroup(userId: string, groupId: string) {
    await this.requireGroup(userId, groupId);
    await this.prisma.contactGroup.delete({ where: { id: groupId } });
    return { deleted: true };
  }

  async addMember(userId: string, groupId: string, dto: AddMemberDto) {
    const targetGroupId = dto.groupId || groupId;
    await this.assertCanAddMember(userId, targetGroupId, 1);

    const contactId = await this.resolveMemberContactId(userId, dto);

    const already = await this.prisma.contactMember.findFirst({
      where: { groupId: targetGroupId, contactId },
    });
    if (already) {
      throw new BadRequestException("This contact is already in the group.");
    }

    const contact = await this.prisma.contact.findUniqueOrThrow({ where: { id: contactId } });
    const member = await this.prisma.$transaction(async (tx) => {
      return this.createMembership(tx, targetGroupId, contact);
    });

    return toMemberDto(member);
  }

  async deleteMember(userId: string, memberId: string) {
    const member = await this.prisma.contactMember.findUnique({
      where: { id: memberId },
      include: { group: true },
    });
    if (!member || member.group.userId !== userId) {
      throw new NotFoundException("Group member not found.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.contactMember.delete({ where: { id: memberId } });
      await this.syncMemberCount(tx, member.groupId);
    });

    return { deleted: true };
  }

  async inviteToGroup(userId: string, groupId: string, dto: { phone?: string; contactId?: string }) {
    const group = await this.requireGroup(userId, groupId);
    const inviter = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const targets: Array<{ phone: string; name: string }> = [];

    if (dto.contactId) {
      const contact = await this.requireContact(userId, dto.contactId);
      targets.push({ phone: contact.phone, name: contact.name });
    } else if (dto.phone) {
      targets.push({ phone: dto.phone, name: dto.phone });
    } else {
      for (const member of group.members) {
        targets.push({ phone: member.phone, name: member.name });
      }
    }

    const created = [];
    for (const target of targets) {
      const phoneDigits = digitsOnly(target.phone);
      if (phoneDigits.length < 7 || phoneDigits === inviter.phoneDigits) {
        continue;
      }
      const existing = await this.prisma.groupInvitation.findFirst({
        where: { groupId, inviteePhoneDigits: phoneDigits, status: "PENDING" },
      });
      if (existing) {
        created.push(existing);
        continue;
      }
      const invitee = await this.prisma.user.findFirst({ where: { phoneDigits } });
      const invite = await this.prisma.groupInvitation.create({
        data: {
          id: `inv-${crypto.randomUUID().slice(0, 8)}`,
          groupId,
          inviterId: userId,
          inviteeUserId: invitee?.id,
          inviteePhone: target.phone,
          inviteePhoneDigits: phoneDigits,
          inviteeName: target.name,
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
      invitations: created.map((invite) => ({
        id: invite.id,
        phone: invite.inviteePhone,
        status: invite.status,
      })),
    };
  }

  async listInvitations(userId: string) {
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

  async acceptInvitation(userId: string, invitationId: string) {
    return this.respondToInvitation(userId, invitationId, "ACCEPTED");
  }

  async declineInvitation(userId: string, invitationId: string) {
    return this.respondToInvitation(userId, invitationId, "DECLINED");
  }

  private async respondToInvitation(
    userId: string,
    invitationId: string,
    status: "ACCEPTED" | "DECLINED",
  ) {
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
      throw new NotFoundException("Invitation not found.");
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
      data: { status, respondedAt: new Date(), inviteeUserId: userId },
    });
    return { id: updated.id, status: updated.status, groupId: updated.groupId };
  }

  async getReferral(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User account not found.");
    }

    const shareUrl = `https://safealert.app/invite/${user.id}`;
    return {
      title: REFERRAL_COPY.title,
      subtitle: REFERRAL_COPY.subtitle,
      shareUrl,
      shareText: `${user.fullName} invited you to Safety Circle. Join their safety circle: ${shareUrl}`,
      cta: REFERRAL_COPY.cta,
    };
  }

  async getPlanUsage(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User account not found.");
    }

    const planId = user.subscriptionTier === SubscriptionTier.PREMIUM ? "plan-pro" : "plan-free";
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    const maxGroups = plan?.maxGroups ?? 2;
    const maxMembersPerGroup = plan?.maxContacts ?? 5;
    const groupCount = await this.prisma.contactGroup.count({ where: { userId } });
    const unlimitedGroups = maxGroups === 0;
    const canCreateGroup = unlimitedGroups || groupCount < maxGroups;
    const isFree = user.subscriptionTier === SubscriptionTier.FREE;

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

  private toGroupWithPresence(
    group: Parameters<typeof toGroupDto>[0],
    maxMembersPerGroup: number,
    userId: string,
    phoneDigits?: string,
  ) {
    const viewerPhone = phoneDigits ?? "";
    const memberOnline = group.members.filter((member) =>
      this.realtime.isPhoneOnline(member.phoneDigits),
    ).length;
    const ownerCounted =
      group.userId === userId &&
      this.realtime.isUserOnline(userId) &&
      !group.members.some((member) => member.phoneDigits === viewerPhone);
    const onlineCount = memberOnline + (ownerCounted ? 1 : 0);
    return {
      ...toGroupDto(group, maxMembersPerGroup, onlineCount),
      members: group.members.map((member) =>
        toMemberDto(member, this.realtime.isPhoneOnline(member.phoneDigits)),
      ),
    };
  }

  private async requireContact(userId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, userId },
      include: contactInclude,
    });
    if (!contact) {
      throw new NotFoundException("Contact not found.");
    }
    return contact;
  }

  private async requireGroup(userId: string, groupId: string) {
    const group = await this.prisma.contactGroup.findFirst({
      where: { id: groupId, userId },
      include: groupInclude,
    });
    if (!group) {
      throw new NotFoundException("Group not found.");
    }
    return group;
  }

  private async loadOwnedContacts(userId: string, ids: string[]) {
    if (!ids.length) {
      return [];
    }
    const uniqueIds = [...new Set(ids)];
    const contacts = await this.prisma.contact.findMany({
      where: { userId, id: { in: uniqueIds } },
    });
    if (contacts.length !== uniqueIds.length) {
      throw new BadRequestException("One or more contacts were not found in your address book.");
    }
    return contacts;
  }

  private async assertCanAddMember(userId: string, groupId: string, additional: number) {
    const plan = await this.getPlanUsage(userId);
    await this.requireGroup(userId, groupId);
    const memberCount = await this.prisma.contactMember.count({ where: { groupId } });
    this.assertMemberCap(memberCount + additional, plan.maxMembersPerGroup);
  }

  private assertMemberCap(count: number, maxMembersPerGroup: number) {
    if (maxMembersPerGroup !== 0 && count > maxMembersPerGroup) {
      throw new ForbiddenException(
        `This plan allows up to ${maxMembersPerGroup} members per group.`,
      );
    }
  }

  private async createMembership(
    tx: Prisma.TransactionClient,
    groupId: string,
    contact: { id: string; name: string; phone: string; relationship: string },
  ) {
    const member = await tx.contactMember.create({
      data: {
        id: `mem-${crypto.randomUUID().slice(0, 8)}`,
        groupId,
        contactId: contact.id,
        name: contact.name,
        phone: contact.phone,
        phoneDigits: digitsOnly(contact.phone),
        relationship: contact.relationship,
      },
    });
    await this.syncMemberCount(tx, groupId);
    return member;
  }

  private async syncMemberCount(tx: Prisma.TransactionClient, groupId: string) {
    const memberCount = await tx.contactMember.count({ where: { groupId } });
    await tx.contactGroup.update({
      where: { id: groupId },
      data: { memberCount },
    });
  }

  private async resolveExcludedIds(userId: string, options: ListContactsOptions) {
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

  private async resolveMemberContactId(userId: string, dto: AddMemberDto) {
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
        throw new BadRequestException("Multiple contacts match that name. Pick one from suggested contacts.");
      }
      throw new BadRequestException("No matching contact. Add them from All Contacts first.");
    }

    throw new BadRequestException("Provide a contactId or a name and phone number.");
  }
}
