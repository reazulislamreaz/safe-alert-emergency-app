import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { OptionalJwtGuard } from "../../common/guards/optional-jwt.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtPayload } from "../../config/env";
import { UploadsService } from "./uploads.service";
import { PresignUploadDto } from "./dto/presign.dto";
import { UPLOAD_MAX_BYTES, UPLOAD_MAX_FILES } from "./uploads.constants";

@ApiTags("Uploads")
@ApiBearerAuth("access-token")
@Controller("api/uploads")
@UseGuards(OptionalJwtGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post("images")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor("files", UPLOAD_MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: UPLOAD_MAX_BYTES, files: UPLOAD_MAX_FILES },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
        },
      },
      required: ["files"],
    },
  })
  @ApiOperation({ summary: "Upload profile photos (JPEG/PNG/WebP/GIF, max 3, 5 MB each) to S3" })
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user?: JwtPayload,
  ) {
    const stored = await this.uploads.uploadFiles(files ?? [], user?.sub);
    return {
      success: true,
      data: {
        files: stored,
        countLabel: `${stored.length}/${UPLOAD_MAX_FILES}`,
      },
    };
  }

  @Post("presign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Presigned S3 PUT URL for direct browser/mobile upload" })
  async presign(@Body() dto: PresignUploadDto, @CurrentUser() user?: JwtPayload) {
    const data = await this.uploads.presign(dto.contentType, dto.fileName, user?.sub);
    return { success: true, data };
  }
}
