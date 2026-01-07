import { CorsOptions } from "cors";

export function createCorsOptions(): CorsOptions {
  const originsEnv = process.env.CORS_ORIGINS || "*";

  if (originsEnv === "*") {
    return {
      origin: true,
      credentials: false,
    };
  }

  const allowedOrigins = originsEnv.split(",").map((o) => o.trim());

  return {
    origin: allowedOrigins,
    credentials: false,
  };
}


