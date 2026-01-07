## Project Guide: JSON-to-Video/Audio Render API

### 1. Vision and Scope
- **Goal**: An open-source, JSON-driven API that renders videos from videos, images, and audio using FFmpeg, plus an admin dashboard for managing users, API keys, jobs, and assets.
- **Primary Use Cases**:
  - Automated video generation from workflows (e.g., n8n, Zapier-like tools, Postman).
  - JSON-to-video prototypes similar to Creatomate or JSON2Video, but self-hostable on Railway.
  - Lightweight internal tools that need programmatic video rendering.

### 2. High-Level Architecture
- **Runtime**: Node.js + TypeScript.
- **Process Layout**:
  - **Web API service**: Handles HTTP requests, authentication, JSON validation, job creation, job status queries, and dashboard routes.
  - **Worker service**: Dedicated process that consumes render jobs and runs FFmpeg.
- **Storage**:
  - **Database**: Postgres on Railway (users, API keys, jobs, assets).
  - **Object Storage**: Railway Buckets for source assets and rendered outputs.
- **Rendering Engine**:
  - FFmpeg (invoked via static binary or library wrapper) for compositing video/image/audio tracks defined by JSON.

### 3. Core Concepts
- **User**: Owns API keys and jobs.
- **API Key**: Used by external clients to authenticate when calling the JSON-to-video API.
- **Job**: A render task created from a JSON spec, progresses through states (queued → processing → completed/failed).
- **Asset**: A media file stored in Railway Buckets (videos, images, audio).

### 4. JSON Render Specification (Initial Version)
- **Canvas**:
  - `width`, `height`, `fps`, optional background color.
- **Duration Rules**:
  - Optional root `duration`.
  - Otherwise, choose longest track marked as `parentDurationDecider`.
  - Fallback to longest track overall.
- **Tracks** (components):
  - `type`: `video` | `image` | `audio`
  - `src`: public or signed URL (ideally from Railway Buckets).
  - `start`: seconds offset in final timeline.
  - `duration`: optional, can be trimmed relative to source.
  - `mute`: boolean to mute video/audio track.
  - `fit`: `cover` | `contain` | `stretch` (for video/image).
  - `position`: x, y, scale, anchor (top-left, center, etc.) – initially minimal.
  - `z`: layer order.
  - `parentDurationDecider`: optional boolean; if `true`, this track is a candidate for deciding total duration.
- **Output**:
  - `format`: `mp4` (initially), possible `mov` later.
  - `codec`: `h264` + `aac` default.
  - Basic quality options (e.g., `crf`, `preset`, `bitrate`).

### 5. Key Features (Phase 1)
- **API**:
  - Create a render job from JSON.
  - Get job status and progress.
  - Upload assets via signed URLs.
- **Rendering Capabilities**:
  - Combine multiple videos, images, and audio tracks.
  - Control start times and durations per component.
  - Mute specific videos or audio tracks.
  - Choose which track(s) determine overall render length.
- **Admin Dashboard**:
  - User registration and login.
  - Manage API keys (create, revoke, rotate).
  - View jobs with status, progress, and output URLs.
  - View recent requests and basic usage metrics.

### 6. Railway Compatibility
- **Design Principles**:
  - Use environment variables for all secrets; no hardcoded keys.
  - Prefer static FFmpeg binaries (`ffmpeg-static` or similar) to avoid OS-specific setup.
  - Provide a clear Railway configuration (services, ports, health checks).
- **Storage Integration**:
  - Use Railway Buckets SDK/HTTP API for:
    - Generating upload URLs (PUT) for assets.
    - Generating signed public URLs with 7-day expiry for rendered outputs.

### 7. Security and Access
- **Dashboard Auth**:
  - Email/password login with secure password hashing.
  - Session or JWT-based authentication for dashboard routes.
- **API Auth**:
  - API key authentication via header (e.g., `x-api-key`).
  - Store only hashed API keys in the database.
- **CORS**:
  - Allow HTTP requests from any origin by default (n8n, Postman, arbitrary frontends).
  - Make CORS configuration overridable via environment variable.

### 8. Roadmap (Beyond Phase 1)
- **Rendering Enhancements**:
  - Text and shape layers.
  - Captions/subtitles.
  - Transitions and simple animations.
  - Audio mixing options (ducking, fades).
- **Developer Experience**:
  - Template API (define a JSON template + variables).
  - Webhooks for job completion.
  - Client SDKs (Node.js, maybe others).
- **Operational Features**:
  - Rate limiting and quotas per user.
  - Extended analytics and logs.
  - Multi-tenant / organization support.

This guide describes **what** we are building and the boundaries of the system. The companion `implementationguide.md` will describe **how** we will implement it step by step.



