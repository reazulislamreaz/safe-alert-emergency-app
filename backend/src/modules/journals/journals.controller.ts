import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { JournalService } from "./journal.service";
import { CreateJournalDto, UpdateJournalDto } from "./dto/journal.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";

@ApiTags("Journal")
@ApiBearerAuth("access-token")
@Controller("api/journals")
@UseGuards(JwtAuthGuard)
export class JournalsController {
  constructor(private readonly journalService: JournalService) {}

  @Get("types")
  @ApiOperation({ summary: "Journal tags: Incident, Test, Update" })
  types() {
    return { success: true, data: this.journalService.getTypes() };
  }

  @Get()
  @ApiOperation({ summary: "Incident Journal list" })
  async list(@CurrentUser() user: JwtPayload) {
    const data = await this.journalService.list(user.sub);
    return { success: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Save a New Entry" })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJournalDto) {
    const data = await this.journalService.create(user.sub, dto);
    return { success: true, data };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one journal entry" })
  @ApiParam({ name: "id", example: "jrn-incident-01" })
  async get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.journalService.get(user.sub, id);
    return { success: true, data };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a journal entry" })
  @ApiParam({ name: "id", example: "jrn-incident-01" })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateJournalDto,
  ) {
    const data = await this.journalService.update(user.sub, id, dto);
    return { success: true, data };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a journal entry" })
  @ApiParam({ name: "id", example: "jrn-incident-01" })
  async remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.journalService.remove(user.sub, id);
    return { success: true, data };
  }
}
