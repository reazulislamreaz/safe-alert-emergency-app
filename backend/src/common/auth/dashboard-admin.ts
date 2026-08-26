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

export function isDashboardSession(user?: JwtPayload | null): boolean {
  return (
    !!user &&
    user.aud === "dashboard" &&
    isSuperAdminRole(user.role) &&
    isDesignatedAdminEmail(user.email)
  );
}

export function tokenAudience(user?: JwtPayload | null): JwtAudience {
  return user?.aud === "dashboard" ? "dashboard" : "app";
}
