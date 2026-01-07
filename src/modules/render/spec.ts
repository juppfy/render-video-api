import { z } from "zod";

// Longform-focused render spec for v1:
// - Up to 4 background tracks (video/image)
// - Audio tracks up to a combined duration of ~3 hours
// - Backgrounds looped (if images) or sequenced with simple transitions
// - Audio tracks played sequentially with fades, no overlap
// - All src URLs must be publicly accessible (HTTP/HTTPS)

export const canvasSchema = z.object({
  // If width/height are omitted, we will infer them from the chosen quality (16:9).
  width: z.number().int().min(16).max(3840).optional(),
  height: z.number().int().min(16).max(2160).optional(),
  fps: z.number().int().min(1).max(60).default(30),
  backgroundColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color")
    .optional(),
});

export const backgroundTrackSchema = z.object({
  type: z.enum(["video", "image"]),
  // Must be a publicly accessible URL
  src: z
    .string()
    .url()
    .refine(
      (v) => v.startsWith("http://") || v.startsWith("https://"),
      "Background src must be a publicly accessible HTTP(S) URL"
    ),
  fit: z.enum(["cover", "contain", "stretch"]).default("cover"),
  // Optional per-background duration hint; if omitted, use intrinsic duration or loop
  durationSeconds: z.number().positive().optional(),
  // Simple crossfade duration between this and the next background
  transitionSeconds: z.number().min(0).max(10).default(1),
});

export const audioTrackSchema = z.object({
  // Must be a publicly accessible URL
  src: z
    .string()
    .url()
    .refine(
      (v) => v.startsWith("http://") || v.startsWith("https://"),
      "Audio src must be a publicly accessible HTTP(S) URL"
    ),
  // Optional hint; real duration will be probed with ffprobe
  durationSeconds: z.number().positive().optional(),
  volume: z.number().min(0).max(2).default(1),
  fadeInSeconds: z.number().min(0).max(10).default(1),
  fadeOutSeconds: z.number().min(0).max(10).default(1),
});

export const outputSchema = z.object({
  format: z.enum(["mp4"]).default("mp4"),
  videoCodec: z.enum(["h264"]).default("h264"),
  audioCodec: z.enum(["aac"]).default("aac"),
  // Quality preset: 720p or 1080p (both 16:9). Used to infer width/height when omitted.
  quality: z.enum(["720p", "1080p"]).default("1080p"),
  crf: z.number().int().min(18).max(30).default(23),
  preset: z
    .enum(["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow"])
    .default("medium"),
  // Optional hard cap on final duration; otherwise derived from audio sequence
  maxDurationSeconds: z.number().positive().max(3 * 60 * 60).optional(),
});

export const longformRenderSpecSchema = z
  .object({
    preset: z.literal("longform-basic").default("longform-basic"),
    canvas: canvasSchema,
    backgrounds: z
      .array(backgroundTrackSchema)
      .min(1, "At least one background is required")
      .max(4, "No more than 4 backgrounds are allowed"),
    audios: z
      .array(audioTrackSchema)
      .min(1, "At least one audio track is required")
      .max(32, "Too many audio tracks; keep under 32 for stability"),
    output: outputSchema.optional(),
  })
  .superRefine((spec, ctx) => {
    // If user provided duration hints, ensure we don't obviously exceed 3 hours
    const hintedTotalAudioSeconds = spec.audios
      .map((a) => a.durationSeconds ?? 0)
      .reduce((a, b) => a + b, 0);

    const limitSeconds = 3 * 60 * 60; // 3 hours

    if (hintedTotalAudioSeconds > limitSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total hinted audio duration must not exceed 3 hours",
        path: ["audios"],
      });
    }

    if (spec.output?.maxDurationSeconds && spec.output.maxDurationSeconds > limitSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "maxDurationSeconds cannot exceed 3 hours",
        path: ["output", "maxDurationSeconds"],
      });
    }
  });

export type CanvasSpec = z.infer<typeof canvasSchema>;
export type BackgroundTrackSpec = z.infer<typeof backgroundTrackSchema>;
export type AudioTrackSpec = z.infer<typeof audioTrackSchema>;
export type OutputSpec = z.infer<typeof outputSchema>;
export type LongformRenderSpec = z.infer<typeof longformRenderSpecSchema>;


