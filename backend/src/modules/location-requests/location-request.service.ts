import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ContactGroupKind,
  LocationRequestStatus,
  NotificationType,
  ScheduledJobType,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationService } from "../notifications/notification.service";
import { JobsService } from "../jobs/jobs.service";
import { buildShareableLocation } from "../../common/utils/location-share";
import {
  CreateLocationRequestDto,
  RespondLocationRequestDto,
} from "./dto/location-request.dto";

@Injectable()
export class LocationRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly jobs: JobsService,
  ) {}

  async create(requesterId: string, dto: CreateLocationRequestDto) {
    if (dto.targetUserId === requesterId) {
      throw new BadRequestException("You cannot request your own location.");
    }

    const group = await this.prisma.contactGroup.findUnique({
      where: { id: dto.groupId },
      include: { members: true },
    });
    if (!group) {
      throw new NotFoundException("Safety Circle group not found.");
    }
    if (group.kind !== ContactGroupKind.FAMILY_FRIENDS) {
      throw new ForbiddenException(
        "Location requests are only allowed within a Family/Friends Safety Circle.",
      );
    }

    const requester = await this.prisma.user.findUniqueOrThrow({ where: { id: requesterId } });
    const target = await this.prisma.user.findUnique({ where: { id: dto.targetUserId } });
    if (!target) {
      throw new NotFoundException("Target user not found.");
    }

    const requesterInGroup =
      group.userId === requesterId ||
      group.members.some((member) => member.phoneDigits === requester.phoneDigits);
    const targetInGroup =
      group.userId === dto.targetUserId ||
      group.members.some((member) => member.phoneDigits === target.phoneDigits);

    if (!requesterInGroup || !targetInGroup) {
      throw new ForbiddenException("Both users must belong to the Family/Friends circle.");
    }

    const pending = await this.prisma.locationRequest.findFirst({
      where: {
        requesterId,
        targetUserId: dto.targetUserId,
        groupId: dto.groupId,
        status: LocationRequestStatus.PENDING,
      },
    });
    if (pending) {
      return this.toDto(pending, requester.fullName, target.fullName);
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const request = await this.prisma.locationRequest.create({
      data: {
        requesterId,
        targetUserId: dto.targetUserId,
        groupId: dto.groupId,
        status: LocationRequestStatus.PENDING,
        expiresAt,
      },
    });

    await this.jobs.enqueue(ScheduledJobType.LOCATION_REQUEST_EXPIRE, request.id, expiresAt);

    await this.notifications.createForUser({
      userId: dto.targetUserId,
      type: NotificationType.LOCATION_REQUEST,
      title: "Location request",
      body: `${requester.fullName.split(" ")[0]} requested your location in ${group.name}.`,
      refLabel: group.name,
      contactId: request.id,
    });

    return this.toDto(request, requester.fullName, target.fullName);
  }

  async inbox(userId: string) {
    const items = await this.prisma.locationRequest.findMany({
      where: {
        OR: [{ targetUserId: userId }, { requesterId: userId }],
      },
      include: {
        requester: { select: { fullName: true } },
        target: { select: { fullName: true } },
        group: { select: { name: true, kind: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      items: items.map((item) => ({
        ...this.toDto(item, item.requester.fullName, item.target.fullName),
        groupName: item.group.name,
        groupKind: item.group.kind,
        isIncoming: item.targetUserId === userId,
      })),
    };
  }

  async respond(userId: string, id: string, dto: RespondLocationRequestDto) {
    const request = await this.prisma.locationRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { fullName: true } },
        target: { select: { fullName: true } },
      },
    });
    if (!request) {
      throw new NotFoundException("Location request not found.");
    }
    if (request.targetUserId !== userId) {
      throw new ForbiddenException("Only the recipient can respond to this request.");
    }
    if (request.status !== LocationRequestStatus.PENDING) {
      throw new BadRequestException("This location request is no longer pending.");
    }
    if (request.expiresAt && request.expiresAt.getTime() < Date.now()) {
      await this.prisma.locationRequest.update({
        where: { id },
        data: { status: LocationRequestStatus.EXPIRED, respondedAt: new Date() },
      });
      await this.jobs.cancel(ScheduledJobType.LOCATION_REQUEST_EXPIRE, id);
      throw new BadRequestException("This location request has expired.");
    }

    if (dto.action === "DECLINE") {
      const updated = await this.prisma.locationRequest.update({
        where: { id },
        data: {
          status: LocationRequestStatus.DECLINED,
          respondedAt: new Date(),
        },
      });
      await this.jobs.cancel(ScheduledJobType.LOCATION_REQUEST_EXPIRE, id);
      await this.notifications.createForUser({
        userId: request.requesterId,
        type: NotificationType.LOCATION_REQUEST,
        title: "Location request declined",
        body: `${request.target.fullName.split(" ")[0]} declined your location request.`,
        refLabel: "Declined",
        contactId: id,
      });
      return this.toDto(updated, request.requester.fullName, request.target.fullName);
    }

    if (typeof dto.latitude !== "number" || typeof dto.longitude !== "number") {
      throw new BadRequestException("Latitude and longitude are required to approve.");
    }

    const address = dto.address?.trim() || "Shared location";
    const updated = await this.prisma.locationRequest.update({
      where: { id },
      data: {
        status: LocationRequestStatus.APPROVED,
        respondedAt: new Date(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        address,
      },
    });
    await this.jobs.cancel(ScheduledJobType.LOCATION_REQUEST_EXPIRE, id);

    await this.notifications.createForUser({
      userId: request.requesterId,
      type: NotificationType.LOCATION_REQUEST,
      title: "Location shared",
      body: `${request.target.fullName.split(" ")[0]} shared their location once.`,
      refLabel: "Approved",
      contactId: id,
    });

    const dtoOut = this.toDto(updated, request.requester.fullName, request.target.fullName);
    return {
      ...dtoOut,
      shareableLocation: buildShareableLocation({
        latitude: dto.latitude,
        longitude: dto.longitude,
        address,
      }),
    };
  }

  private toDto(
    request: {
      id: string;
      requesterId: string;
      targetUserId: string;
      groupId: string;
      status: LocationRequestStatus;
      latitude: number | null;
      longitude: number | null;
      address: string | null;
      respondedAt: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
    },
    requesterName: string,
    targetName: string,
  ) {
    return {
      id: request.id,
      requesterId: request.requesterId,
      requesterName,
      targetUserId: request.targetUserId,
      targetName,
      groupId: request.groupId,
      status: request.status,
      latitude: request.latitude,
      longitude: request.longitude,
      address: request.address,
      respondedAt: request.respondedAt?.toISOString() ?? null,
      expiresAt: request.expiresAt?.toISOString() ?? null,
      createdAt: request.createdAt.toISOString(),
      ongoingAccess: false,
    };
  }
}
