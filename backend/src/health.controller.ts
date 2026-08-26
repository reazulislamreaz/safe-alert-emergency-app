import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Health")
@Controller()
export class HealthController {
  @Get("health")
  @ApiOperation({ summary: "Liveness probe" })
  @ApiOkResponse({
    description: "Service is up",
    schema: {
      example: {
        status: "ok",
        service: "SafeAlert Emergency Backend",
        timestamp: "2026-08-26T02:42:00.000Z",
        uptime: 12.5,
      },
    },
  })
  health() {
    return {
      status: "ok",
      service: "SafeAlert Emergency Backend",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
