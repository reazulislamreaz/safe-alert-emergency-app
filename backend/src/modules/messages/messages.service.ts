import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MediaType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { assertStoredMediaUrl } from "../../common/utils/media-url";
import { SendDirectMessageDto, StartConversationDto } from "./dto/message.dto";

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, fullName: true, avatar: true } },
        userB: { select: { id: true, fullName: true, avatar: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      items: conversations.map((conversation) => {
        const peer = conversation.userAId === userId ? conversation.userB : conversation.userA;
        const last = conversation.messages[0];
        return {
          id: conversation.id,
          peer: {
            id: peer.id,
            fullName: peer.fullName,
            avatar: peer.avatar,
          },
          lastMessage: last
            ? {
                id: last.id,
                text: last.text,
                mediaType: last.mediaType,
                createdAt: last.createdAt.toISOString(),
              }
            : null,
          updatedAt: conversation.updatedAt.toISOString(),
        };
      }),
    };
  }

  async startOrGet(userId: string, dto: StartConversationDto) {
    if (dto.peerUserId === userId) {
      throw new BadRequestException("Cannot start a conversation with yourself.");
    }
    await this.assertCircleLink(userId, dto.peerUserId);
    const [userAId, userBId] =
      userId < dto.peerUserId ? [userId, dto.peerUserId] : [dto.peerUserId, userId];

    const conversation = await this.prisma.conversation.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: {},
      include: {
        userA: { select: { id: true, fullName: true, avatar: true } },
        userB: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    const peer = conversation.userAId === userId ? conversation.userB : conversation.userA;
    return { id: conversation.id, peer };
  }

  async getMessages(userId: string, conversationId: string) {
    const conversation = await this.requireParticipant(userId, conversationId);
    const messages = await this.prisma.directMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return {
      conversationId: conversation.id,
      messages: messages.map((message) => ({
        id: message.id,
        senderUserId: message.senderUserId,
        text: message.text,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        mimeType: message.mimeType,
        createdAt: message.createdAt.toISOString(),
        isMine: message.senderUserId === userId,
      })),
    };
  }

  async send(userId: string, conversationId: string, dto: SendDirectMessageDto) {
    await this.requireParticipant(userId, conversationId);
    const text = (dto.text ?? "").trim();
    const mediaUrl = assertStoredMediaUrl(dto.mediaUrl);
    if (!text && !mediaUrl) {
      throw new BadRequestException("Message text or media is required.");
    }

    let mediaType: MediaType = MediaType.NONE;
    if (mediaUrl) {
      const mime = (dto.mimeType || "").toLowerCase();
      mediaType =
        mime.startsWith("video/") || dto.mediaType === "VIDEO"
          ? MediaType.VIDEO
          : MediaType.IMAGE;
    }

    const message = await this.prisma.directMessage.create({
      data: {
        conversationId,
        senderUserId: userId,
        text: text || (mediaType === MediaType.VIDEO ? "📹 Video" : "📷 Photo"),
        mediaUrl,
        mediaType,
        mimeType: dto.mimeType,
      },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      senderUserId: message.senderUserId,
      text: message.text,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      mimeType: message.mimeType,
      createdAt: message.createdAt.toISOString(),
      isMine: true,
    };
  }

  /** Mutual circle: shared contact membership or one has the other in contacts by phone. */
  private async assertCircleLink(userId: string, peerUserId: string) {
    const [user, peer] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: peerUserId } }),
    ]);
    if (!user || !peer) {
      throw new NotFoundException("User not found.");
    }

    const peerInUserContacts = peer.phoneDigits
      ? await this.prisma.contact.findFirst({
          where: { userId, phoneDigits: peer.phoneDigits },
        })
      : null;
    const userInPeerContacts = user.phoneDigits
      ? await this.prisma.contact.findFirst({
          where: { userId: peerUserId, phoneDigits: user.phoneDigits },
        })
      : null;

    const sharedGroup =
      user.phoneDigits && peer.phoneDigits
        ? await this.prisma.contactMember.findFirst({
            where: {
              phoneDigits: user.phoneDigits,
              group: { members: { some: { phoneDigits: peer.phoneDigits } } },
            },
          })
        : null;

    const ownerPeerMember =
      peer.phoneDigits
        ? await this.prisma.contactMember.findFirst({
            where: { phoneDigits: peer.phoneDigits, group: { userId } },
          })
        : null;
    const ownerUserMember =
      user.phoneDigits
        ? await this.prisma.contactMember.findFirst({
            where: { phoneDigits: user.phoneDigits, group: { userId: peerUserId } },
          })
        : null;

    if (
      !peerInUserContacts &&
      !userInPeerContacts &&
      !sharedGroup &&
      !ownerPeerMember &&
      !ownerUserMember
    ) {
      throw new ForbiddenException(
        "Direct messages are limited to Safety Circle connections.",
      );
    }
  }

  private async requireParticipant(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException("Conversation not found.");
    }
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException("You are not a participant in this conversation.");
    }
    return conversation;
  }
}
