import express from "express";
import { prisma } from "../../db/client";
import { dashboardAuth, type DashboardRequest } from "../../middleware/dashboardAuth";
import { generateApiKey, hashApiKey } from "../../utils/crypto";

const router = express.Router();

// Get API keys for current user (hashed values only, plus metadata)
router.get("/", dashboardAuth, async (req: DashboardRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      lastFour: true,
      active: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return res.json({ items: apiKeys });
});

// Create a new API key and return the plaintext once
router.post("/", dashboardAuth, async (req: DashboardRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name } = req.body as { name?: string };
  const label = name || "Default key";

  const apiKeyPlain = generateApiKey();
  const lastFour = apiKeyPlain.slice(-4);
  const keyHash = await hashApiKey(apiKeyPlain);

  const record = await prisma.apiKey.create({
    data: {
      userId: req.userId,
      name: label,
      keyHash,
      lastFour,
      active: true,
    },
  });

  return res.status(201).json({
    id: record.id,
    name: record.name,
    lastFour: record.lastFour,
    active: record.active,
    createdAt: record.createdAt,
    // Plaintext is only returned once here:
    apiKey: apiKeyPlain,
  });
});

// Soft-delete (deactivate) an API key
router.delete("/:id", dashboardAuth, async (req: DashboardRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;

  const key = await prisma.apiKey.findFirst({
    where: { id, userId: req.userId },
  });

  if (!key) {
    return res.status(404).json({ error: "API key not found" });
  }

  await prisma.apiKey.update({
    where: { id },
    data: { active: false },
  });

  return res.status(204).send();
});

export const apiKeysRouter = router;


