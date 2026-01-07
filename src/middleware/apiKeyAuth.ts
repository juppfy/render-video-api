import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db/client";
import { verifyApiKey } from "../utils/crypto";

// Augment Request with authenticated user/apiKey (kept lightweight for now)
export interface AuthedRequest extends Request {
  userId?: string;
  apiKeyId?: string;
}

export async function apiKeyAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const headerKey =
    (req.headers["x-api-key"] as string | undefined) ??
    (req.headers["authorization"] as string | undefined);

  const apiKey = headerKey?.trim();

  if (!apiKey) {
    return res.status(401).json({ error: "Missing API key (use x-api-key header)" });
  }

  try {
    const keys = await prisma.apiKey.findMany({
      where: {
        active: true,
      },
    });

    for (const keyRecord of keys) {
      const ok = await verifyApiKey(apiKey, keyRecord.keyHash);
      if (ok) {
        req.userId = keyRecord.userId;
        req.apiKeyId = keyRecord.id;

        // Fire-and-forget lastUsedAt update
        void prisma.apiKey.update({
          where: { id: keyRecord.id },
          data: { lastUsedAt: new Date() },
        });

        return next();
      }
    }

    return res.status(401).json({ error: "Invalid or inactive API key" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("apiKeyAuth error", err);
    return res.status(500).json({ error: "Internal auth error" });
  }
}


