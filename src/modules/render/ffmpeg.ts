import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { longformRenderSpecSchema, type LongformRenderSpec } from "./spec";

interface RenderResult {
  outputPath: string;
  durationSeconds: number;
}

function getTmpOutputPath(): string {
  const dir = os.tmpdir();
  const name = `render-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
  return path.join(dir, name);
}

/**
 * Compute total audio duration based on provided hints.
 * In real rendering we will probe with ffprobe, but hints are enough for an MVP.
 */
function estimateAudioDurationSeconds(spec: LongformRenderSpec): number {
  const hinted = spec.audios
    .map((a) => a.durationSeconds ?? 0)
    .reduce((a, b) => a + b, 0);

  const limit = 3 * 60 * 60; // 3h cap
  const est = Math.min(hinted || 60, limit); // default 60s if no hints

  if (spec.output?.maxDurationSeconds) {
    return Math.min(est, spec.output.maxDurationSeconds);
  }
  return est;
}

function resolveCanvasSize(spec: LongformRenderSpec): { width: number; height: number } {
  const quality = spec.output?.quality ?? "1080p";

  // 16:9 presets
  const presetSizes: Record<typeof quality, { width: number; height: number }> = {
    "720p": { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 },
  };

  const base = presetSizes[quality];

  const width = spec.canvas.width ?? base.width;
  const height = spec.canvas.height ?? base.height;

  return { width, height };
}

export async function renderLongformToFile(payload: unknown): Promise<RenderResult> {
  const parsed = longformRenderSpecSchema.parse(payload);

  const durationSeconds = estimateAudioDurationSeconds(parsed);
  const { width, height } = resolveCanvasSize(parsed);
  const outputPath = getTmpOutputPath();

  if (!ffmpegPath) {
    throw new Error("ffmpeg-static not found");
  }

  const args: string[] = [];

  const backgrounds = parsed.backgrounds;
  const bgCount = backgrounds.length;

  // Each background gets an equal slice of the total duration.
  const sliceDuration = durationSeconds / bgCount;

  // Background inputs first.
  backgrounds.forEach((bg) => {
    if (bg.type === "image") {
      // Loop the image for the duration of its slice.
      args.push("-loop", "1");
    }
    args.push("-t", String(sliceDuration), "-i", bg.src);
  });

  // Audio inputs: each src as separate input, after backgrounds
  for (const audio of parsed.audios) {
    args.push("-i", audio.src);
  }

  const audioInputsCount = parsed.audios.length;

  const filterComplexParts: string[] = [];
  const outputMaps: string[] = [];

  // Video background processing: scale each to canvas, then concat sequentially.
  const videoFilters: string[] = [];
  for (let i = 0; i < bgCount; i += 1) {
    const inLabel = `[${i}:v]`;
    const outLabel = `[v${i}]`;
    // Simple fade-in and fade-out for nicer transitions between slices.
    const fadeDur = Math.min(sliceDuration / 4, 1.5);
    videoFilters.push(
      `${inLabel}scale=${width}:${height}:force_original_aspect_ratio=cover,setsar=1,` +
        `fade=t=in:st=0:d=${fadeDur},` +
        `fade=t=out:st=${Math.max(sliceDuration - fadeDur, 0)}:d=${fadeDur}${outLabel}`,
    );
  }

  if (bgCount === 1) {
    videoFilters.push("[v0]copy[vout]");
  } else {
    const concatInputs = Array.from({ length: bgCount }, (_, idx) => `[v${idx}]`).join("");
    videoFilters.push(`${concatInputs}concat=n=${bgCount}:v=1:a=0[vout]`);
  }

  filterComplexParts.push(...videoFilters);

  // If we have audio tracks, chain them sequentially.
  if (audioInputsCount > 0) {
    // We will use concat over inputs after applying fades.
    const audioFilters: string[] = [];
    for (let i = 0; i < audioInputsCount; i += 1) {
      const inLabel = `[${bgCount + i}:a]`; // audio inputs come after backgrounds
      const outLabel = `[a${i}]`;
      const track = parsed.audios[i];
      const fadeIn = track.fadeInSeconds ?? 0;
      const fadeOut = track.fadeOutSeconds ?? 0;

      const components: string[] = [];
      if (track.volume !== 1) {
        components.push(`volume=${track.volume}`);
      }
      if (fadeIn > 0) {
        components.push(`afade=t=in:st=0:d=${fadeIn}`);
      }
      if (fadeOut > 0) {
        components.push(`afade=t=out:st=0:d=${fadeOut}`);
      }

      if (components.length > 0) {
        audioFilters.push(`${inLabel}${components.join(",")}${outLabel}`);
      } else {
        // Pass-through
        audioFilters.push(`${inLabel}anull${outLabel}`);
      }
    }

    // Concatenate audio streams sequentially
    const concatInputs = parsed.audios
      .map((_, idx) => `[a${idx}]`)
      .join("");
    audioFilters.push(`${concatInputs}concat=n=${audioInputsCount}:v=0:a=1[aout]`);

    filterComplexParts.push(...audioFilters);
    outputMaps.push("-map", "[vout]", "-map", "[aout]");
  } else {
    // No audio: just map video
    outputMaps.push("-map", "[vout]");
  }

  if (filterComplexParts.length > 0) {
    args.push("-filter_complex", filterComplexParts.join(";"));
  }

  args.push(
    ...outputMaps,
    "-c:v",
    "libx264",
    "-preset",
    parsed.output?.preset ?? "medium",
    "-crf",
    String(parsed.output?.crf ?? 23),
    "-pix_fmt",
    "yuv420p",
    "-t",
    String(durationSeconds),
    "-y",
    outputPath,
  );

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(ffmpegPath, args);

    proc.stderr.on("data", (data) => {
      // eslint-disable-next-line no-console
      console.log("[ffmpeg]", data.toString());
    });

    proc.on("error", (err) => {
      reject(err);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });

  // Quick sanity check the file exists
  await fs.access(outputPath);

  return {
    outputPath,
    durationSeconds,
  };
}


