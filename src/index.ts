import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { createCorsOptions } from "./middleware/cors";
import { v1Router } from "./routes/v1";
import { authRouter } from "./modules/auth/routes";
import { apiKeysRouter } from "./modules/apikeys/routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(cors(createCorsOptions()));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Auth & dashboard-ish JSON APIs
app.use("/auth", authRouter);
app.use("/dashboard/api-keys", apiKeysRouter);

// Versioned public API
app.use("/v1", v1Router);

// Basic 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`);
});




