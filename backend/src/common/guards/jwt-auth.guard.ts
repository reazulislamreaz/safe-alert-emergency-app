import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtAudience, JwtPayload } from "../../config/env";
import { PrismaService } from "../../prisma/prisma.service";
import { hashToken } from "../utils/token-hash";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      const payload = this.jwt.verify<JwtPayload>(token);
      const revoked = await this.prisma.revokedToken.findUnique({
        where: { tokenHash: hashToken(token) },
      });
      if (revoked && revoked.expiresAt > new Date()) {
        throw new UnauthorizedException("Session ended. Please log in again.");
      }
      const record = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          subscriptionTier: true,
        },
      });
      if (!record) {
        throw new UnauthorizedException("Session ended. Please log in again.");
      }
      const aud: JwtAudience | undefined =
        payload.aud === "dashboard" ? "dashboard" : payload.aud === "app" ? "app" : undefined;
      request.user = {
        sub: record.id,
        email: record.email,
        phone: record.phone,
        role: record.role,
        tier: record.subscriptionTier,
        aud: aud ?? (payload.aud as JwtAudience | undefined),
        iat: payload.iat,
        exp: payload.exp,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
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
