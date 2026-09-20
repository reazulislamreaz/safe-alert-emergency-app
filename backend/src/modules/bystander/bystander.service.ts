import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MessageType, NotificationType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationService } from "../notifications/notification.service";
import { AlertService } from "../alerts/alert.service";
import { digitsOnly } from "../../common/utils/phone";
import { BystanderRelayDto } from "./dto/bystander.dto";

@Injectable()
export class BystanderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly alerts: AlertService,
  ) {}

  async relay(senderUserId: string, dto: BystanderRelayDto) {
    const message = dto.message.trim();
    if (!message) {
      throw new BadRequestException("Message is required.");
    }

    const sender = await this.prisma.user.findUniqueOrThrow({ where: { id: senderUserId } });
    const group = await this.prisma.contactGroup.findUnique({
      where: { id: dto.groupId },
      include: { members: true, user: { select: { id: true, fullName: true } } },
    });
    if (!group) {
      throw new NotFoundException("Safety Circle group not found.");
    }

    const senderAllowed =
      group.userId === senderUserId ||
      group.members.some((member) => member.phoneDigits === sender.phoneDigits);
    if (!senderAllowed) {
      throw new ForbiddenException("You must be a member of this Safety Circle to use Bystander Mode.");
    }

    let targetMember = dto.targetMemberId
      ? group.members.find((member) => member.id === dto.targetMemberId)
      : undefined;
    if (!targetMember && dto.phone) {
      const phoneDigits = digitsOnly(dto.phone);
      targetMember = group.members.find((member) => member.phoneDigits === phoneDigits);
    }
    if (!targetMember) {
      throw new BadRequestException("Select a contact from the Safety Circle to notify.");
    }

    // Privacy: do not return full group roster — only masked target info
    const targetPhoneDigits = targetMember.phoneDigits;
    const targetUser = targetPhoneDigits
      ? await this.prisma.user.findFirst({ where: { phoneDigits: targetPhoneDigits } })
      : null;

    const labeledMessage = `Bystander-assisted message from ${sender.fullName.split(" ")[0]}: ${message}`;

    const relay = await this.prisma.bystanderRelay.create({
      data: {
        senderUserId,
        targetUserId: targetUser?.id,
        targetPhone: targetMember.phone,
        targetPhoneDigits,
        targetName: targetMember.name,
        groupId: group.id,
        alertId: dto.alertId || null,
        message: labeledMessage,
      },
    });

    if (targetUser) {
      await this.notifications.createForUser({
        userId: targetUser.id,
        type: NotificationType.BYSTANDER,
        title: "Bystander-assisted message",
        body: labeledMessage,
        refLabel: "One-time",
        alertId: dto.alertId,
      });
    }

    if (dto.alertId) {
      try {
        await this.alerts.addMessage(
          dto.alertId,
          "Safety Circle System",
          labeledMessage,
          MessageType.SOS,
          senderUserId,
        );
      } catch {
        // Alert may be inaccessible; relay audit still recorded
      }
    }

    return {
      id: relay.id,
      oneTime: true,
      ongoingAccessGranted: false,
      target: {
        name: targetMember.name,
        // Mask phone for privacy in response
        phoneMasked: maskPhone(targetMember.phone),
      },
      message: labeledMessage,
      alertId: dto.alertId ?? null,
      createdAt: relay.createdAt.toISOString(),
      deliveredInApp: Boolean(targetUser),
      note: targetUser
        ? "One-time bystander message delivered to the contact's Safety Circle account."
        : "Contact is not a registered user yet. Relay was recorded; in-app delivery pending registration.",
    };
  }
}

function maskPhone(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.length < 4) {
    return "****";
  }
  return `***-***-${digits.slice(-4)}`;
}
