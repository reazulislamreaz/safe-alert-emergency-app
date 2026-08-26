import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JOURNAL_TYPES, parseJournalType, toJournalDto } from "../../common/mappers/journal.mapper";
import { CreateJournalDto, UpdateJournalDto } from "./dto/journal.dto";

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  getTypes() {
    return { types: JOURNAL_TYPES.map((type) => ({ ...type })) };
  }

  async list(userId: string) {
    const entries = await this.prisma.journal.findMany({
      where: { userId },
      orderBy: { triggeredAt: "desc" },
    });
    return { entries: entries.map(toJournalDto) };
  }

  async get(userId: string, id: string) {
    return toJournalDto(await this.requireOwned(userId, id));
  }

  async create(userId: string, dto: CreateJournalDto) {
    const body = (dto.body || dto.content || "").trim();
    if (!body) {
      throw new BadRequestException("Describe the incident or update.");
    }

    const entry = await this.prisma.journal.create({
      data: {
        id: `jrn-${crypto.randomUUID().slice(0, 8)}`,
        userId,
        type: parseJournalType(dto.type),
        body,
        source: "MANUAL",
        triggeredAt: new Date(),
      },
    });

    return toJournalDto(entry);
  }

  async update(userId: string, id: string, dto: UpdateJournalDto) {
    await this.requireOwned(userId, id);
    const body = (dto.body || dto.content)?.trim();

    const entry = await this.prisma.journal.update({
      where: { id },
      data: {
        ...(body ? { body } : {}),
        ...(dto.type ? { type: parseJournalType(dto.type) } : {}),
      },
    });

    return toJournalDto(entry);
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    await this.prisma.journal.delete({ where: { id } });
    return { deleted: true };
  }

  private async requireOwned(userId: string, id: string) {
    const entry = await this.prisma.journal.findFirst({ where: { id, userId } });
    if (!entry) {
      throw new NotFoundException("Journal entry not found.");
    }
    return entry;
  }
}
