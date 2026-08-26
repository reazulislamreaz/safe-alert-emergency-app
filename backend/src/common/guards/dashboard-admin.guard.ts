import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtPayload } from "../../config/env";
import { DashboardAdminService } from "../auth/dashboard-admin.service";

@Injectable()
export class DashboardAdminGuard implements CanActivate {
  constructor(private readonly dashboardAdmin: DashboardAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest<{ user?: JwtPayload }>().user;
    await this.dashboardAdmin.assertDashboardAccess(user);
    return true;
  }
}
