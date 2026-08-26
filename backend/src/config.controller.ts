import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { env } from "./config/env";

@ApiTags("Config")
@Controller("api/config")
export class ConfigController {
  @Get()
  @ApiOperation({ summary: "Public client config (Google Maps browser key)" })
  @ApiOkResponse({
    description: "Runtime config for the dashboard and citizen app",
  })
  config() {
    return {
      success: true,
      data: {
        googleMapsApiKey: env.googleMapsApiKey,
      },
    };
  }
}
