import { Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Future-ready coverage checks. Super Admin currently has unrestricted access.
 * When SECURITY_OPERATOR lands, filter by DashboardCoverage rows.
 */
@Injectable()
export class CoverageService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanAccessSubscriber(
    operatorUserId: string,
    subscriberUserId: string,
  ): Promise<boolean> {
    const operator = await this.prisma.user.findUnique({
      where: { id: operatorUserId },
      select: { role: true },
    });
    if (!operator) {
      return false;
    }
    if (operator.role === Role.SUPER_ADMIN) {
      return true;
    }
    const coverage = await this.prisma.dashboardCoverage.findUnique({
      where: {
        operatorUserId_subscriberUserId: {
          operatorUserId,
          subscriberUserId,
        },
      },
    });
    return Boolean(coverage);
  }

  async listCoveredSubscriberIds(operatorUserId: string): Promise<string[] | null> {
    const operator = await this.prisma.user.findUnique({
      where: { id: operatorUserId },
      select: { role: true },
    });
    if (!operator) {
      return [];
    }
    if (operator.role === Role.SUPER_ADMIN) {
      return null; // null = unrestricted
    }
    const rows = await this.prisma.dashboardCoverage.findMany({
      where: { operatorUserId },
      select: { subscriberUserId: true },
    });
    return rows.map((row) => row.subscriberUserId);
  }
}
