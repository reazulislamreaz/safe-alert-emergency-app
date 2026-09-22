import { Role } from "@prisma/client";
import { env, JwtAudience, JwtPayload } from "../../config/env";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function designatedDashboardAdminEmail(): string {
  return normalizeEmail(env.dashboardAdminEmail);
}

export function isDesignatedAdminEmail(email: string): boolean {
  return normalizeEmail(email) === designatedDashboardAdminEmail();
}

export function isSuperAdminRole(role?: string | null): boolean {
  return role === Role.SUPER_ADMIN;
}

export function isSecurityOperatorRole(role?: string | null): boolean {
  return role === Role.SECURITY_OPERATOR;
}

export function isDashboardOperatorRole(role?: string | null): boolean {
  return isSuperAdminRole(role) || isSecurityOperatorRole(role);
}

/** Super Admin (designated) or Security Operator with dashboard audience. */
export function isDashboardSession(user?: JwtPayload | null): boolean {
  if (!user || user.aud !== "dashboard") {
    return false;
  }
  if (isSuperAdminRole(user.role) && isDesignatedAdminEmail(user.email)) {
    return true;
  }
  return isSecurityOperatorRole(user.role);
}

export function tokenAudience(user?: JwtPayload | null): JwtAudience {
  return user?.aud === "dashboard" ? "dashboard" : "app";
}
