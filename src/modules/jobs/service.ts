import { prisma } from "../../db/client";
import type { JobStatus } from "@prisma/client";

export async function createJob(userId: string, payload: unknown) {
  return prisma.job.create({
    data: {
      userId,
      payload,
      status: "QUEUED",
      progress: 0,
    },
  });
}

export async function getJobForUser(jobId: string, userId: string) {
  return prisma.job.findFirst({
    where: {
      id: jobId,
      userId,
    },
  });
}

export async function listJobsForUser(userId: string, limit = 50, cursor?: string) {
  return prisma.job.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
  });
}

export async function updateJobStatus(
  jobId: string,
  data: {
    status?: JobStatus;
    progress?: number;
    errorMessage?: string | null;
    outputUrl?: string | null;
  },
) {
  return prisma.job.update({
    where: { id: jobId },
    data,
  });
}


