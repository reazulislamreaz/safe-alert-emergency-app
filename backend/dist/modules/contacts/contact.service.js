"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactService = exports.ContactService = void 0;
const database_js_1 = require("../../core/database.js");
class ContactService {
    getGroups(userId) {
        const groups = database_js_1.db.contactGroups.filter((g) => g.userId === userId);
        return groups.map((g) => ({
            ...g,
            members: database_js_1.db.contactMembers.filter((m) => m.groupId === g.id),
        }));
    }
    createGroup(userId, name, color) {
        const newGroup = {
            id: `grp-${Date.now()}`,
            userId,
            name,
            color: color || "#3A67D5",
            isDefaultSOS: true,
            memberCount: 0,
        };
        database_js_1.db.contactGroups.push(newGroup);
        return newGroup;
    }
    addMember(groupId, name, phone, relationship) {
        const newMember = {
            id: `mem-${Date.now()}`,
            groupId,
            name,
            phone,
            relationship,
            isJoinedCall: false,
        };
        database_js_1.db.contactMembers.push(newMember);
        const group = database_js_1.db.contactGroups.find((g) => g.id === groupId);
        if (group)
            group.memberCount++;
        return newMember;
    }
    deleteMember(memberId) {
        const idx = database_js_1.db.contactMembers.findIndex((m) => m.id === memberId);
        if (idx === -1)
            return false;
        const member = database_js_1.db.contactMembers[idx];
        const group = database_js_1.db.contactGroups.find((g) => g.id === member.groupId);
        if (group)
            group.memberCount = Math.max(0, group.memberCount - 1);
        database_js_1.db.contactMembers.splice(idx, 1);
        return true;
    }
}
exports.ContactService = ContactService;
exports.contactService = new ContactService();
