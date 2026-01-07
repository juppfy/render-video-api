import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/client";
import { hashPassword, verifyPassword } from "../../utils/crypto";
import type { DashboardRequest } from "../../middleware/dashboardAuth";
import { dashboardAuth } from "../../middleware/dashboardAuth";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "User already exists" });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash, role: "USER" },
  });

  return res.status(201).json({ id: user.id, email: user.email });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  return res.json({ token });
});

router.get("/me", dashboardAuth, async (req: DashboardRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return res.json({ user });
});

export const authRouter = router;



