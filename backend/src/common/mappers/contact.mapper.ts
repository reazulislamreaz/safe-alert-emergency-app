import { Contact, ContactGroup, ContactMember } from "@prisma/client";

type MemberWithGroup = ContactMember & { group: Pick<ContactGroup, "id" | "name" | "color"> };
type ContactWithMemberships = Contact & { memberships: MemberWithGroup[] };
type GroupWithMembers = ContactGroup & { members: ContactMember[] };

export function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function firstNameFromName(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? name;
}

export function groupTagFromName(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? name;
}

export function toContactDto(contact: ContactWithMemberships) {
  const primary = contact.memberships[0]?.group ?? null;
  return {
    id: contact.id,
    userId: contact.userId,
    name: contact.name,
    firstName: firstNameFromName(contact.name),
    phone: contact.phone,
    relationship: contact.relationship,
    status: contact.relationship,
    initials: initialsFromName(contact.name),
    group: primary
      ? {
          id: primary.id,
          name: primary.name,
          tag: groupTagFromName(primary.name),
          color: primary.color,
        }
      : null,
    groups: contact.memberships.map((membership) => ({
      id: membership.group.id,
      name: membership.group.name,
      tag: groupTagFromName(membership.group.name),
      color: membership.group.color,
    })),
    createdAt: contact.createdAt.toISOString(),
  };
}

export function toMemberDto(member: ContactMember, online = false) {
  return {
    id: member.id,
    groupId: member.groupId,
    contactId: member.contactId,
    name: member.name,
    firstName: firstNameFromName(member.name),
    chipLabel: firstNameFromName(member.name),
    phone: member.phone,
    relationship: member.relationship,
    initials: initialsFromName(member.name),
    isJoinedCall: member.isJoinedCall,
    online,
  };
}

export function toGroupDto(
  group: GroupWithMembers,
  maxMembersPerGroup: number,
  onlineCount = 0,
) {
  const cap = maxMembersPerGroup === 0 ? null : maxMembersPerGroup;
  const canAddMember = cap === null || group.memberCount < cap;
  const memberCount = group.memberCount || group.members.length;
  return {
    id: group.id,
    userId: group.userId,
    name: group.name,
    tag: groupTagFromName(group.name),
    color: group.color,
    isDefaultSOS: group.isDefaultSOS,
    memberCount,
    memberLimit: cap,
    memberLabel: cap ? `${memberCount}/${cap} members` : `${memberCount} members`,
    memberCounter: cap ? `${memberCount}/${cap}` : `${memberCount}`,
    presenceLabel: `${memberCount} members · ${onlineCount} online`,
    onlineCount,
    fillRatio: cap ? Math.min(1, memberCount / cap) : 0,
    canAddMember,
    inviteCta: "Invite",
    members: group.members.map((member) => toMemberDto(member)),
  };
}
