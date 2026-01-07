# Railway Template Description

## Short Description

Deploy and Host Render Video API with Railway

---

## Template Overview

# Deploy and Host Render Video API on Railway

Render Video API is an open-source, JSON-driven service that programmatically creates longform videos by merging up to 4 background images/videos with sequential audio tracks. Built with Node.js, FFmpeg, and PostgreSQL, it provides a simple REST API for automated video generation workflows.

## About Hosting Render Video API

Hosting Render Video API on Railway involves deploying four integrated services: a web API server that handles HTTP requests and job creation, a background worker process that executes FFmpeg rendering tasks, a PostgreSQL database for storing users, API keys, and job metadata, and a Railway Bucket for storing rendered video outputs with 7-day signed URLs. The deployment is fully automated with zero configuration—Railway auto-generates secrets, connects services, runs database migrations, and scales resources as needed. Perfect for developers who need a self-hostable alternative to commercial video rendering services.

## Common Use Cases

- Automated video generation from workflows (n8n, Zapier, custom integrations)
- Longform content creation by merging multiple backgrounds with sequential audio
- API-first video rendering for applications that need programmatic video creation
- Self-hosted video rendering infrastructure for teams wanting full control

## Dependencies for Render Video API Hosting

- Node.js 18+ runtime environment
- PostgreSQL database for user and job management
- Railway Bucket (S3-compatible storage) for rendered video outputs
- FFmpeg (included via ffmpeg-static package) for video processing

### Deployment Dependencies

- [Railway Documentation](https://docs.railway.app)
- [Prisma ORM](https://www.prisma.io/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

### Implementation Details

The API accepts JSON specifications defining canvas dimensions (720p or 1080p), background media (1-4 images/videos), and sequential audio tracks (up to 3 hours total). The worker process uses FFmpeg to composite backgrounds with smooth transitions and chain audio files sequentially with fade effects. All rendered videos are uploaded to Railway Bucket and accessible via time-limited signed URLs.

## Why Deploy Render Video API on Railway?

Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Render Video API on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.

