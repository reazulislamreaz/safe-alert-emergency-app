import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config/env.js";
import { User } from "../../core/database.js";

export interface AuthenticatedUserPayload {
  sub: string;
  email: string;
  phone: string;
  role: "USER" | "OPS_ADMIN" | "SUPER_ADMIN";
  tier: "FREE" | "PREMIUM";
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
export function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Missing or malformed Bearer token.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthenticatedUserPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Session token has expired. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      error: "Invalid authentication token.",
    });
  }
}

/**
 * Middleware to enforce Role-Based Access Control (RBAC)
 */
export function requireRole(...allowedRoles: Array<"USER" | "OPS_ADMIN" | "SUPER_ADMIN">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Required role: [${allowedRoles.join(", ")}], current role: ${req.user.role}`,
      });
    }

    next();
  };
}
