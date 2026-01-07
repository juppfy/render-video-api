import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface DashboardRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";

export function dashboardAuth(req: DashboardRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}



