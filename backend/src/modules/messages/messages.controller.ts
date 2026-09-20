import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";
import { MessagesService } from "./messages.service";
import { SendDirectMessageDto, StartConversationDto } from "./dto/message.dto";

@ApiTags("Messages")
@ApiBearerAuth("access-token")
@Controller("api/messages")
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get("conversations")
  @ApiOperation({ summary: "List 1-on-1 conversations" })
  async list(@CurrentUser() user: JwtPayload) {
    const data = await this.service.listConversations(user.sub);
    return { success: true, data };
  }

  @Post("conversations")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Start or get a 1-on-1 conversation with a circle member" })
  async start(@CurrentUser() user: JwtPayload, @Body() dto: StartConversationDto) {
    const data = await this.service.startOrGet(user.sub, dto);
    return { success: true, data };
  }

  @Get("conversations/:id")
  @ApiOperation({ summary: "Get messages in a conversation" })
  async get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    const data = await this.service.getMessages(user.sub, id);
    return { success: true, data };
  }

  @Post("conversations/:id")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Send a text/photo/video message" })
  async send(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: SendDirectMessageDto,
  ) {
    const data = await this.service.send(user.sub, id, dto);
    return { success: true, data };
  }
}
