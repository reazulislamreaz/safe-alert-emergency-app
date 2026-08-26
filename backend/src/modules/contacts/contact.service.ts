import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async getGroups(userId: string) {
    return this.prisma.contactGroup.findMany({
      where: { userId },
      include: { members: true },
      orderBy: { name: "asc" },
    });
  }

  async createGroup(userId: string, name: string, color?: string) {
    return this.prisma.contactGroup.create({
      data: {
        id: `grp-${Date.now()}`,
        userId,
        name,
        color: color || "#3A67D5",
        isDefaultSOS: true,
        memberCount: 0,
      },
    });
  }

  async addMember(groupId: string, name: string, phone: string, relationship: string) {
    const group = await this.prisma.contactGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException("Group not found");
    }

    const [member] = await this.prisma.$transaction([
      this.prisma.contactMember.create({
        data: {
          id: `mem-${Date.now()}`,
          groupId,
          name,
          phone,
          relationship,
          isJoinedCall: false,
        },
      }),
      this.prisma.contactGroup.update({
        where: { id: groupId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    return member;
  }

  async deleteMember(memberId: string) {
    const member = await this.prisma.contactMember.findUnique({ where: { id: memberId } });
    if (!member) {
      return false;
    }

    await this.prisma.$transaction([
      this.prisma.contactMember.delete({ where: { id: memberId } }),
      this.prisma.contactGroup.update({
        where: { id: member.groupId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);

    return true;
  }
}
