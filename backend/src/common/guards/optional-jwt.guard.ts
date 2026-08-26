import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "../../config/env";

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: JwtPayload;
    }>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return true;
    }

    try {
      request.user = this.jwt.verify<JwtPayload>(authHeader.slice("Bearer ".length));
    } catch {
      // Match the previous Express behavior: unauthenticated routes still work.
    }

    return true;
  }
}
