import { v4 as uuidv4 } from "uuid";
import { db, ContactGroup, ContactMember } from "../../core/database.js";

export class ContactService {
  getGroups(userId: string): (ContactGroup & { members: ContactMember[] })[] {
    const groups = db.contactGroups.filter((g) => g.userId === userId);
    return groups.map((g) => ({
      ...g,
      members: db.contactMembers.filter((m) => m.groupId === g.id),
    }));
  }

  createGroup(userId: string, name: string, color: string): ContactGroup {
    const newGroup: ContactGroup = {
      id: `grp-${Date.now()}`,
      userId,
      name,
      color: color || "#3A67D5",
      isDefaultSOS: true,
      memberCount: 0,
    };
    db.contactGroups.push(newGroup);
    return newGroup;
  }

  addMember(
    groupId: string,
    name: string,
    phone: string,
    relationship: string
  ): ContactMember {
    const newMember: ContactMember = {
      id: `mem-${Date.now()}`,
      groupId,
      name,
      phone,
      relationship,
      isJoinedCall: false,
    };
    db.contactMembers.push(newMember);

    const group = db.contactGroups.find((g) => g.id === groupId);
    if (group) group.memberCount++;

    return newMember;
  }

  deleteMember(memberId: string): boolean {
    const idx = db.contactMembers.findIndex((m) => m.id === memberId);
    if (idx === -1) return false;
    const member = db.contactMembers[idx];
    const group = db.contactGroups.find((g) => g.id === member.groupId);
    if (group) group.memberCount = Math.max(0, group.memberCount - 1);
    db.contactMembers.splice(idx, 1);
    return true;
  }
}

export const contactService = new ContactService();
