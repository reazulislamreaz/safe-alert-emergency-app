import { ForbiddenException, Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtPayload } from "../../config/env";
import {
  designatedDashboardAdminEmail,
  isDashboardSession,
  isDesignatedAdminEmail,
  isSuperAdminRole,
} from "./dashboard-admin";

@Injectable()
export class DashboardAdminService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSingleAdmin();
  }

  async ensureSingleAdmin(): Promise<void> {
    const email = designatedDashboardAdminEmail();
    await this.prisma.user.updateMany({
      where: {
        role: Role.SUPER_ADMIN,
        NOT: { email },
      },
      data: { role: Role.USER },
    });
    await this.prisma.user.updateMany({
      where: { email },
      data: { role: Role.SUPER_ADMIN },
    });
  }

  async assertDashboardAccess(user?: JwtPayload | null): Promise<void> {
    if (!user?.sub) {
      throw new UnauthorizedException("Authentication required.");
    }

    const record = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, email: true, role: true },
    });

    if (!record) {
      throw new UnauthorizedException("Session ended. Please log in again.");
    }

    const session: JwtPayload = {
      ...user,
      email: record.email,
      role: record.role,
    };

    if (
      !isDashboardSession(session) ||
      !isDesignatedAdminEmail(record.email) ||
      !isSuperAdminRole(record.role)
    ) {
      throw new ForbiddenException("Dashboard access is limited to the Super Admin account.");
    }
  }
}
