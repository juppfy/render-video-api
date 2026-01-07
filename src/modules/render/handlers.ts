import type { Response } from "express";
import { longformRenderSpecSchema } from "./spec";
import type { AuthedRequest } from "../../middleware/apiKeyAuth";
import { createJob, getJobForUser, listJobsForUser } from "../jobs/service";

export async function createRenderJob(req: AuthedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parseResult = longformRenderSpecSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid render spec",
      details: parseResult.error.flatten(),
    });
  }

  try {
    const job = await createJob(req.userId, parseResult.data);
    return res.status(202).json({ jobId: job.id, status: job.status });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("createRenderJob error", err);
    return res.status(500).json({ error: "Failed to create render job" });
  }
}

export async function getJob(req: AuthedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    const job = await getJobForUser(id, req.userId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    return res.json(job);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("getJob error", err);
    return res.status(500).json({ error: "Failed to fetch job" });
  }
}

export async function listJobs(req: AuthedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const limit = Number(req.query.limit ?? "50");
  const cursor = req.query.cursor as string | undefined;

  try {
    const jobs = await listJobsForUser(req.userId, Math.min(limit, 100), cursor);
    return res.json({ items: jobs });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("listJobs error", err);
    return res.status(500).json({ error: "Failed to list jobs" });
  }
}



