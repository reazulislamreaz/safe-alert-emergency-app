import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { MessageType, NotificationType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationService } from "../notifications/notification.service";
import { AlertService } from "../alerts/alert.service";
import { MailService } from "../../mail/mail.service";
import { digitsOnly } from "../../common/utils/phone";
import { BystanderRelayDto } from "./dto/bystander.dto";

@Injectable()
export class BystanderService {
  private readonly logger = new Logger(BystanderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly alerts: AlertService,
    private readonly mail: MailService,
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

    const targetPhoneDigits = targetMember.phoneDigits;

    // Enforce one-time relay per sender → target within a group
    const prior = await this.prisma.bystanderRelay.findUnique({
      where: {
        senderUserId_groupId_targetPhoneDigits: {
          senderUserId,
          groupId: group.id,
          targetPhoneDigits,
        },
      },
    });
    if (prior) {
      throw new ConflictException(
        "Bystander Mode is one-time only. You have already sent a message to this contact in this Safety Circle.",
      );
    }

    const targetUser = targetPhoneDigits
      ? await this.prisma.user.findFirst({ where: { phoneDigits: targetPhoneDigits } })
      : null;

    // alertId must be an alert the sender can access
    if (dto.alertId) {
      await this.alerts.getMessages(dto.alertId, senderUserId);
    }

    const labeledMessage = `Bystander-assisted message from ${sender.fullName.split(" ")[0]}: ${message}`;

    let outboundChannel: string | null = null;
    let outboundStatus: string | null = null;

    // Out-of-band delivery for non-registered contacts
    if (!targetUser) {
      const delivered = await this.deliverOutbound({
        toPhone: targetMember.phone,
        toName: targetMember.name,
        body: labeledMessage,
        senderName: sender.fullName.split(" ")[0],
      });
      outboundChannel = delivered.channel;
      outboundStatus = delivered.status;
    }

    let relay;
    try {
      relay = await this.prisma.bystanderRelay.create({
        data: {
          senderUserId,
          targetUserId: targetUser?.id,
          targetPhone: targetMember.phone,
          targetPhoneDigits,
          targetName: targetMember.name,
          groupId: group.id,
          alertId: dto.alertId || null,
          message: labeledMessage,
          outboundChannel,
          outboundStatus,
        },
      });
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === "P2002") {
        throw new ConflictException(
          "Bystander Mode is one-time only. You have already sent a message to this contact in this Safety Circle.",
        );
      }
      throw error;
    }

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
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Bystander alert message skipped: ${messageText}`);
      }
    }

    return {
      id: relay.id,
      oneTime: true,
      ongoingAccessGranted: false,
      target: {
        name: targetMember.name,
        phoneMasked: maskPhone(targetMember.phone),
      },
      message: labeledMessage,
      alertId: dto.alertId ?? null,
      createdAt: relay.createdAt.toISOString(),
      deliveredInApp: Boolean(targetUser),
      outboundChannel,
      outboundStatus,
      note: targetUser
        ? "One-time bystander message delivered to the contact's Safety Circle account. No ongoing alert or location access was granted."
        : outboundStatus === "sent"
          ? "One-time bystander message delivered out-of-band. No ongoing alert or location access was granted."
          : "Contact is not a registered user. Relay was recorded; out-of-band delivery was queued or logged.",
    };
  }

  private async deliverOutbound(params: {
    toPhone: string;
    toName: string;
    body: string;
    senderName: string;
  }): Promise<{ channel: string; status: string }> {
    const smsUrl = process.env.SMS_WEBHOOK_URL?.trim();
    if (smsUrl) {
      try {
        const response = await fetch(smsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: params.toPhone,
            body: params.body,
            from: "Safety Circle",
          }),
        });
        if (response.ok) {
          return { channel: "sms", status: "sent" };
        }
        this.logger.warn(`SMS webhook failed: ${response.status}`);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.warn(`SMS webhook error: ${detail}`);
      }
    }

    // Optional email when SMTP configured and a matching registered email isn't available —
    // non-users typically only have phone; log for ops visibility.
    if (this.mail.isConfigured()) {
      this.logger.log(
        `Bystander outbound pending SMS for ${maskPhone(params.toPhone)} (no SMS_WEBHOOK_URL). Message recorded.`,
      );
      return { channel: "sms_pending", status: "queued" };
    }

    this.logger.log(
      `Bystander outbound logged for ${maskPhone(params.toPhone)} — configure SMS_WEBHOOK_URL for delivery.`,
    );
    return { channel: "log", status: "logged" };
  }
}

function maskPhone(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.length < 4) {
    return "****";
  }
  return `***-***-${digits.slice(-4)}`;
}
