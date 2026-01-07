## Implementation Guide: JSON-to-Video/Audio Render API

### 1. Tech Stack
- **Language**: TypeScript
- **Runtime**: Node.js (LTS)
- **Frameworks/Libraries**:
  - HTTP: Express or Fastify (we will start with Express for simplicity).
  - Validation: Zod or class-validator (we will use Zod).
  - Database: Postgres via Prisma ORM.
  - Queues: Simple in-DB job queue initially; optional BullMQ/Redis later.
  - Rendering: FFmpeg invoked via `ffmpeg-static` + `child_process` or `fluent-ffmpeg`.
  - Auth: JWT for API + cookie-based session for dashboard (backed by same user table).
  - Dashboard UI: React (Vite or Next.js); initially we can embed as a separate frontend or serve a built bundle from the API.

### 2. High-Level Folder Structure
- `src/`
  - `index.ts` – API server entrypoint.
  - `worker.ts` – job worker entrypoint.
  - `config/`
    - `env.ts` – environment variable parsing and config.
  - `db/`
    - `client.ts` – Prisma client.
  - `modules/`
    - `auth/`
      - `routes.ts`, `service.ts`, `types.ts`
    - `users/`
      - `model.ts`, `service.ts`
    - `apikeys/`
      - `routes.ts`, `service.ts`
    - `jobs/`
      - `routes.ts`, `service.ts`, `worker.ts`, `types.ts`
    - `assets/`
      - `routes.ts`, `service.ts`, `railway-bucket.ts`
    - `render/`
      - `spec.ts` (Zod schemas for JSON spec)
      - `ffmpeg-builder.ts` (builds FFmpeg command lines)
      - `renderer.ts` (orchestrates per-job rendering pipeline)
  - `middleware/`
    - `apiKeyAuth.ts`
    - `dashboardAuth.ts`
    - `errorHandler.ts`
    - `cors.ts`
  - `utils/`
    - `logger.ts`
    - `crypto.ts` (API key hashing, password hashing)
    - `time.ts`
  - `dashboard/`
    - `frontend/` (if we create a small React dashboard inside this repo).

- Root:
  - `package.json`
  - `tsconfig.json`
  - `prisma/schema.prisma`
  - `Dockerfile`
  - `railway.json` or Railway service configuration docs.
  - `projectguide.md`
  - `implementationguide.md`

### 3. Database Schema (Initial)
- **User**
  - `id` (UUID)
  - `email` (unique)
  - `passwordHash`
  - `role` (`USER` | `ADMIN`)
  - `createdAt`, `updatedAt`
- **ApiKey**
  - `id` (UUID)
  - `userId` (FK → User)
  - `name` (label for UI)
  - `keyHash` (hash of the actual key)
  - `lastFour` (for display)
  - `active` (boolean)
  - `createdAt`, `lastUsedAt`
- **Job**
  - `id` (UUID)
  - `userId` (FK → User)
  - `status` (`QUEUED` | `PROCESSING` | `SUCCEEDED` | `FAILED`)
  - `type` (string, default `RENDER`)
  - `payload` (JSONB – render spec)
  - `progress` (0–100)
  - `errorMessage` (nullable)
  - `outputUrl` (nullable; signed URL or bucket key)
  - `createdAt`, `updatedAt`, `startedAt`, `finishedAt`
- **Asset**
  - `id` (UUID)
  - `userId` (FK → User)
  - `type` (`VIDEO` | `IMAGE` | `AUDIO`)
  - `bucketKey` (path in Railway Bucket)
  - `publicUrl` (signed URL or public path)
  - `durationSeconds` (nullable)
  - `metadata` (JSONB)
  - `createdAt`

### 4. Key HTTP Endpoints (Phase 1)
- **Public API (API key auth)**:
  - `POST /v1/render`
    - Body: JSON render spec (validated by Zod).
    - Auth: API key header.
    - Response: `{ jobId }`.
  - `GET /v1/jobs/:id`
    - Returns job status, progress, and `outputUrl` when ready.
  - `GET /v1/jobs`
    - Paginated list of jobs for current API key’s user.
  - `POST /v1/assets/sign-upload`
    - Body: metadata (file type, file name)
    - Response: signed **upload** URL + eventual **public** URL (signed for 7 days).

- **Dashboard / Auth**:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /me`
  - `GET /dashboard/jobs`, `GET /dashboard/jobs/:id`
  - `GET /dashboard/api-keys`, `POST /dashboard/api-keys`, `DELETE /dashboard/api-keys/:id`

- **System**:
  - `GET /health`

### 5. Rendering Flow (Worker)
1. **Fetch Job**:
   - Poll/consume next `QUEUED` job from the database.
   - Mark as `PROCESSING` and set `startedAt`.
2. **Validate Payload**:
   - Use Zod schema in `render/spec.ts`.
   - On error, mark job as `FAILED`.
3. **Prepare Assets**:
   - For each track:
     - Download from Railway Bucket signed URL or directly use bucket path if FFmpeg can read it via HTTP.
     - Optionally cache locally in a temp directory.
   - Use `ffprobe` to retrieve durations and streams.
4. **Resolve Timeline**:
   - Determine overall render duration based on rules:
     - Explicit `spec.duration` OR
     - Longest `parentDurationDecider` track OR
     - Longest track.
   - Clamp each track to render duration.
5. **Build FFmpeg Graph**:
   - Use `ffmpeg-builder.ts` to:
     - **Longform priority mode (v1)**:
       - Accept up to **4 background** tracks (video or image). If images are used, loop them to cover the full final duration and add simple crossfade transitions between them.
       - Accept a list of **audio tracks** whose total duration must not exceed **3 hours**; arrange them sequentially (no overlap) with simple fades at transitions.
       - Assume all `src` URLs are **publicly accessible** (HTTP/HTTPS) and document this clearly to users.
     - Construct `-filter_complex` commands for:
       - Scaling and fitting backgrounds to the canvas.
       - Looping still images for longform timelines.
       - Crossfading between background segments.
       - Chaining audio tracks one after the other with fades, without overlap.
6. **Render**:
   - Run FFmpeg via `child_process.spawn`.
   - Track progress using FFmpeg’s stderr timecodes to approximate timeline progress.
   - Update job `progress` in DB periodically.
7. **Upload Result**:
   - Upload rendered file to Railway Bucket.
   - Generate signed public URL valid for 7 days; store as `outputUrl`.
8. **Finalize**:
   - Mark job `SUCCEEDED` or `FAILED`.
   - Clean up temp files.

### 6. Railway Integration Details
- **Environment Variables** (examples; exact names TBD):
  - `PORT` – HTTP port.
  - `DATABASE_URL` – Postgres connection string.
  - `JWT_SECRET`
  - `SESSION_SECRET`
  - `RAILWAY_BUCKET_ENDPOINT` – S3-compatible endpoint for Railway bucket.
  - `RAILWAY_BUCKET_REGION` – Region name for S3 client (e.g. `us-east-1`).
  - `RAILWAY_BUCKET_NAME` – Bucket name to store renders.
  - `RAILWAY_BUCKET_ACCESS_KEY` – Access key for S3-compatible auth.
  - `RAILWAY_BUCKET_SECRET_KEY` – Secret key for S3-compatible auth.
  - `CORS_ORIGINS` (optional, default `*`).
- **Services**:
  - One web service for `src/index.ts`.
  - One worker service for `src/worker.ts`.
- **Dockerfile**:
  - Install Node.js dependencies.
  - Include `ffmpeg-static` or system FFmpeg.
  - Build TypeScript → JavaScript.
  - Configure CMD for web vs worker (Railway service-specific).

### 7. Security and Constraints
- **Password Handling**:
  - Use bcrypt or argon2 for password hashes.
- **API Key Handling**:
  - Generate random API key.
  - Hash and store; show plaintext only on creation.
  - Scope: per-user; no per-key scopes initially.
- **Request Limits**:
  - Limit input JSON size.
  - Limit number of tracks and max duration (e.g., 300 seconds and 32 tracks initially).
  - Limit max resolution (e.g., 1920x1080).
- **CORS**:
  - Default to `Access-Control-Allow-Origin: *`.
  - Allow overriding via env.

### 8. Implementation Steps (Milestones)
1. **Project Bootstrapping**
   - Initialize Node/TypeScript project.
   - Configure ESLint/Prettier.
   - Add Express + Zod + Prisma + basic middleware (logging, error handling, CORS).
2. **Database & Auth**
   - Define Prisma schema.
   - Implement migration.
   - Implement user registration and login.
   - Implement dashboard session middleware.
3. **API Keys**
   - Implement API key generation, hashing, storage.
   - Implement middleware that authenticates requests by API key.
4. **Jobs & Assets**
   - Implement Job model and CRUD (list by user, fetch by id).
   - Implement simple in-DB job queue (status transitions).
   - Implement asset signing with Railway Buckets.
5. **Render Spec & Validation**
   - Implement Zod schemas for JSON spec.
   - Implement duration resolution logic with tests.
6. **FFmpeg Integration**
   - Implement a minimal “single-video input” render first to validate pipeline.
   - Extend to multiple tracks, overlays, and audio mix.
7. **Worker Process**
   - Implement loop to process `QUEUED` jobs.
   - Wire up progress updates and error handling.
8. **Dashboard (MVP)**
   - Implement basic React UI for:
     - Login/register.
     - API key management.
     - Job list/detail with progress.
   - Serve built assets from the API server.
9. **Refinement**
   - Add logging, clean error responses, better validation messages.
   - Add configuration docs for Railway deployment.

This guide is the implementation roadmap. We will follow these steps incrementally, keeping the project deployable to Railway at each major milestone.


