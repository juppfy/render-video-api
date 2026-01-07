# Render Video API

> An open-source, JSON-driven API for rendering longform videos by merging backgrounds (images/videos) and audio files using FFmpeg. Perfect for API developers who need a simple, self-hostable alternative to commercial video rendering services.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/juppfy/render-video-api)

> **Note**: If a template isn't available yet, follow the [Deployment Guide](DEPLOYMENT.md) for manual setup. After deploying, you can create your own template for one-click deployments!

## 🎯 What is This?

**Render Video API** is a lightweight, self-hostable service that lets you programmatically create videos from JSON specifications. It's designed for:

- **API Developers** who need video rendering in their workflows
- **Automation Tools** like n8n, Zapier, or custom integrations
- **Longform Content** creators who need to merge multiple backgrounds with sequential audio tracks
- **Anyone** who wants a free, open-source alternative to services like Creatomate or JSON2Video

### Key Features

- ✅ **Simple JSON API** - Define videos with a straightforward JSON payload
- ✅ **Longform Support** - Render videos up to 3 hours long
- ✅ **Multiple Backgrounds** - Use up to 4 images/videos as backgrounds with smooth transitions
- ✅ **Sequential Audio** - Chain multiple audio files one after another with fades
- ✅ **Railway-Ready** - Optimized for easy deployment on Railway
- ✅ **7-Day Signed URLs** - Secure, time-limited access to rendered videos
- ✅ **Open Source** - Free to use, modify, and distribute (MIT License)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Railway Postgres)
- Railway Bucket (or any S3-compatible storage)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/juppfy/render-video-api.git
   cd render-video-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (create a `.env` file):
   ```bash
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/rendervideoapi
   JWT_SECRET=your-super-secret-jwt-key
   RAILWAY_BUCKET_NAME=your-bucket-name
   RAILWAY_BUCKET_ENDPOINT=https://your-bucket-endpoint.railway.app
   RAILWAY_BUCKET_REGION=us-east-1
   RAILWAY_BUCKET_ACCESS_KEY=your-access-key
   RAILWAY_BUCKET_SECRET_KEY=your-secret-key
   CORS_ORIGINS=*
   ```

4. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the services** (in two terminals):
   ```bash
   # Terminal 1: API Server
   npm run dev

   # Terminal 2: Worker (processes render jobs)
   npm run dev:worker
   ```

6. **Test the health endpoint**:
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"ok"}
   ```

## 📖 Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Step-by-step instructions for deploying to Railway
- **[Project Guide](projectguide.md)** - High-level architecture and vision
- **[Implementation Guide](implementationguide.md)** - Technical implementation details

## 🔑 Authentication & API Keys

### 1. Register a User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"strongpassword"}'
```

### 2. Login and Get JWT Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"strongpassword"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Create an API Key

```bash
curl -X POST http://localhost:3000/dashboard/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"My API Key"}'
```

**Important**: Save the `apiKey` value from the response immediately - it's only shown once!

## 🎬 Using the Render API

### Create a Render Job

**Endpoint**: `POST /v1/render`  
**Auth**: `x-api-key: YOUR_API_KEY`

**Example Request**:

```json
{
  "preset": "longform-basic",
  "canvas": {
    "fps": 30
  },
  "backgrounds": [
    {
      "type": "image",
      "src": "https://example.com/public-image-1.jpg",
      "fit": "cover",
      "transitionSeconds": 1
    },
    {
      "type": "video",
      "src": "https://example.com/public-video-2.mp4",
      "fit": "cover",
      "transitionSeconds": 1
    }
  ],
  "audios": [
    {
      "src": "https://example.com/public-audio-1.mp3",
      "fadeInSeconds": 1,
      "fadeOutSeconds": 1
    },
    {
      "src": "https://example.com/public-audio-2.mp3",
      "fadeInSeconds": 1,
      "fadeOutSeconds": 1
    }
  ],
  "output": {
    "quality": "1080p"
  }
}
```

**Response**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "QUEUED"
}
```

### Check Job Status

**Endpoint**: `GET /v1/jobs/:id`  
**Auth**: `x-api-key: YOUR_API_KEY`

```bash
curl http://localhost:3000/v1/jobs/JOB_ID \
  -H "x-api-key: YOUR_API_KEY"
```

**Response** (when complete):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCEEDED",
  "progress": 100,
  "outputUrl": "https://signed-url-to-your-video.mp4?expires=...",
  "errorMessage": null,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "finishedAt": "2025-01-01T00:10:00.000Z"
}
```

The `outputUrl` is a **signed URL valid for 7 days** from your Railway bucket.

## 📋 API Specification

### Render Constraints (v1)

- **Backgrounds**: 1-4 images or videos
  - Played sequentially to cover full duration
  - Images are looped/held; videos are trimmed as needed
  - Automatically scaled to 16:9 aspect ratio
  - Quality options: `720p` (1280x720) or `1080p` (1920x1080)

- **Audio**: 1 or more audio files
  - Played **sequentially** (no overlap)
  - Total duration capped at **3 hours**
  - Optional fade in/out per track

- **URL Requirements**:
  - ⚠️ **All `backgrounds[*].src` and `audios[*].src` must be public HTTP(S) URLs**
  - Private URLs or signed URLs that require authentication will fail
  - FFmpeg reads directly from the provided URLs

### Quality Options

- `"720p"` - 1280x720 (16:9)
- `"1080p"` - 1920x1080 (16:9, default)

### Full JSON Schema

See `src/modules/render/spec.ts` for the complete Zod validation schema.

## 🔧 Integration Examples

### Using with n8n

1. Add an **HTTP Request** node
2. Set method to `POST`
3. URL: `https://your-railway-app-url/v1/render`
4. Headers:
   - `x-api-key`: Your API key
   - `Content-Type`: `application/json`
5. Body: JSON render spec (see example above)
6. Add another HTTP Request node to poll `/v1/jobs/:id` until status is `SUCCEEDED`

### Using with Postman

1. Create a new POST request to `/v1/render`
2. Add header: `x-api-key: YOUR_API_KEY`
3. Set body to JSON with your render specification
4. Create a GET request to `/v1/jobs/:id` to check status

### Using with cURL

```bash
# Create render job
JOB_ID=$(curl -X POST https://your-api.com/v1/render \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "preset": "longform-basic",
    "canvas": {"fps": 30},
    "backgrounds": [{"type": "image", "src": "https://example.com/bg.jpg"}],
    "audios": [{"src": "https://example.com/audio.mp3"}],
    "output": {"quality": "1080p"}
  }' | jq -r '.jobId')

# Poll until complete
while true; do
  STATUS=$(curl -s https://your-api.com/v1/jobs/$JOB_ID \
    -H "x-api-key: YOUR_API_KEY" | jq -r '.status')
  
  if [ "$STATUS" = "SUCCEEDED" ]; then
    echo "Render complete!"
    curl -s https://your-api.com/v1/jobs/$JOB_ID \
      -H "x-api-key: YOUR_API_KEY" | jq -r '.outputUrl'
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "Render failed!"
    break
  fi
  
  sleep 5
done
```

## 🚢 Deployment

**Ready to deploy?** Check out our comprehensive **[Deployment Guide](DEPLOYMENT.md)** for step-by-step Railway deployment instructions.

Quick summary:
1. Push code to GitHub
2. Create Railway project
3. Add Postgres database (auto-sets `DATABASE_URL`)
4. Add Railway Bucket (copy credentials to env vars)
5. Set `JWT_SECRET` and bucket credentials
6. Deploy!

## 🏗️ Project Structure

```
rendervideoapi/
├── src/
│   ├── index.ts              # API server entrypoint
│   ├── worker.ts             # Job worker entrypoint
│   ├── modules/
│   │   ├── auth/             # Authentication routes
│   │   ├── apikeys/          # API key management
│   │   ├── render/           # Render spec & FFmpeg logic
│   │   ├── jobs/             # Job service
│   │   └── assets/           # Railway bucket integration
│   ├── middleware/           # Auth, CORS, error handling
│   └── db/                   # Prisma client
├── prisma/
│   └── schema.prisma         # Database schema
├── DEPLOYMENT.md             # Railway deployment guide
├── projectguide.md           # Project vision & architecture
├── implementationguide.md     # Technical implementation details
└── README.md                 # This file
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start API server in development mode
- `npm run dev:worker` - Start worker in development mode
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production API server
- `npm run start:worker` - Start production worker
- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma client

### Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: Railway Buckets (S3-compatible)
- **Rendering**: FFmpeg (via `ffmpeg-static`)
- **Validation**: Zod
- **Auth**: JWT + bcrypt

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Private use
- ✅ Sublicense

## 🤝 Contributing

Contributions are welcome! This is an open-source project designed to help API developers create videos programmatically.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🗺️ Roadmap

- [ ] Background crossfade transitions
- [ ] Text overlays and captions
- [ ] Template system with variables
- [ ] Webhook support for job completion
- [ ] React-based dashboard UI
- [ ] Rate limiting and quotas
- [ ] Multi-tenant/organization support

## ⚠️ Important Notes

- **Public URLs Required**: All background and audio URLs must be publicly accessible. Private URLs or signed URLs requiring authentication will cause renders to fail.
- **Longform Focus**: This API is optimized for longform content (up to 3 hours). For short-form content, consider other solutions.
- **Railway Optimized**: While it can run anywhere, the deployment guide and configuration are optimized for Railway.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/juppfy/render-video-api/issues)
- **Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help

---

**Made with ❤️ for API developers who need simple, self-hostable video rendering.**
