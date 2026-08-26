import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OptionalJwtGuard } from "../../common/guards/optional-jwt.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { DashboardAdminGuard } from "../../common/guards/dashboard-admin.guard";
import { DashboardAdminService } from "../../common/auth/dashboard-admin.service";
import { env } from "../../config/env";

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.jwtSecret,
      signOptions: { expiresIn: env.jwtExpiresIn as `${number}${"d" | "h" | "m" | "s"}` },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, OptionalJwtGuard, RolesGuard, DashboardAdminService, DashboardAdminGuard],
  exports: [AuthService, JwtAuthGuard, OptionalJwtGuard, RolesGuard, DashboardAdminService, DashboardAdminGuard],
})
export class AuthModule {}
