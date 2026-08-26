import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { JwtPayload } from "../../config/env";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const user = context.switchToHttp().getRequest<{ user?: JwtPayload }>().user;
    if (!user) {
      throw new UnauthorizedException("Authentication required.");
    }

    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException(
        "You are not authorized to access the operator console.",
      );
    }

    return true;
  }
}
