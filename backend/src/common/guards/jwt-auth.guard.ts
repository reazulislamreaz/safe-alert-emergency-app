import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "../../config/env";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: JwtPayload;
    }>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Authentication required. Missing or malformed Bearer token.",
      );
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      request.user = this.jwt.verify<JwtPayload>(token);
      return true;
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "TokenExpiredError") {
        throw new UnauthorizedException(
          "Session token has expired. Please log in again.",
        );
      }
      throw new UnauthorizedException("Invalid authentication token.");
    }
  }
}
