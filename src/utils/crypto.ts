import bcrypt from "bcryptjs";
import crypto from "crypto";

const PASSWORD_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateApiKey(): string {
  // 32 bytes → 64 hex chars
  return crypto.randomBytes(32).toString("hex");
}

export async function hashApiKey(apiKey: string): Promise<string> {
  // Reuse bcrypt for API keys for now
  return bcrypt.hash(apiKey, PASSWORD_ROUNDS);
}

export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}



