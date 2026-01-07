import dotenv from "dotenv";
import fs from "fs/promises";
import { prisma } from "./db/client";
import { renderLongformToFile } from "./modules/render/ffmpeg";
import { generateObjectKey, uploadRenderAndGetSignedUrl } from "./modules/assets/railwayBucket";

dotenv.config();

async function processOnce() {
  const job = await prisma.job.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
  });

  if (!job) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Processing job", job.id);

  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: "PROCESSING",
      startedAt: new Date(),
      progress: 5,
    },
  });

  try {
    const { outputPath } = await renderLongformToFile(job.payload);

    const objectKey = generateObjectKey("mp4");
    const publicUrl = await uploadRenderAndGetSignedUrl(outputPath, objectKey);

    // Clean up local temp file
    await fs.unlink(outputPath).catch(() => {});

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        progress: 100,
        outputUrl: publicUrl,
        finishedAt: new Date(),
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error rendering job", job.id, err);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        progress: 100,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
        finishedAt: new Date(),
      },
    });
  }
}

async function main() {
  // eslint-disable-next-line no-console
  console.log("Worker process starting (FFmpeg mode)");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await processOnce();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Worker loop error", err);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Worker crashed", err);
  process.exit(1);
});




