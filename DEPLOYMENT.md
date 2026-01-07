# Railway Deployment Guide

This guide walks you through deploying your own instance of the JSON-to-Video API to Railway. Whether you've forked this repository or cloned it, follow these steps to get your own deployment running.

## Prerequisites

- A GitHub account
- A Railway account (sign up at [railway.app](https://railway.app))

---

## Step 1: Get the Code on GitHub

You have two options:

### Option A: Fork the Repository (Recommended)

1. **Fork the repository**:
   - Go to [https://github.com/juppfy/render-video-api](https://github.com/juppfy/render-video-api)
   - Click the "Fork" button in the top right
   - This creates your own copy of the repository

2. **Your fork is now ready** - you can proceed to Step 2

### Option B: Clone and Push to Your Own Repository

1. **Clone the repository**:
   ```bash
   git clone https://github.com/juppfy/render-video-api.git
   cd render-video-api
   ```

2. **Create your own GitHub repository**:
   - Go to [github.com/new](https://github.com/new)
   - Name it (e.g., `my-render-video-api`)
   - Click "Create repository" (don't initialize with README)

3. **Push to your repository**:
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Create Railway Project

1. **Log in to Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create a new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked/cloned repository (or search for `render-video-api`)
   - Railway will start deploying automatically (it will fail until we add services, that's okay)

---

## Step 3: Add PostgreSQL Database

1. **In your Railway project dashboard**, click "New" → "Database" → "Add PostgreSQL"

2. **Railway automatically**:
   - Creates the database
   - Sets the `DATABASE_URL` environment variable in your code service
   - You don't need to copy anything manually!

3. **Wait for the database to provision** (usually 30-60 seconds)

---

## Step 4: Add Railway Bucket (Storage)

1. **In your Railway project dashboard**, click "New" → "Storage" → "Add Bucket"

2. **Railway will show you bucket credentials**. You'll need to copy these:
   - **Bucket Name** (something like `bucket-abc123`)
   - **Endpoint URL** (something like `https://bucket-abc123.up.railway.app`)
   - **Access Key ID**
   - **Secret Access Key**

3. **Keep this tab open** - you'll paste these into environment variables next

---

## Step 5: Generate JWT Secret

You need a random secret string for authentication. Choose one method:

### Option A: Using Terminal/Command Prompt
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Option B: Online Generator
- Go to [randomkeygen.com](https://randomkeygen.com/)
- Copy any "CodeIgniter Encryption Keys" entry (the long random string)

### Option C: Manual
Just use any long random string like: `my-super-secret-jwt-key-2024-change-this`

**Copy this secret** - you'll paste it into Railway next.

---

## Step 6: Configure Environment Variables

1. **In Railway**, click on your **code service** (the one with your GitHub repo name)

2. **Go to the "Variables" tab**

3. **Add these environment variables** one by one:

   | Variable Name | Value | Where to Get It |
   |--------------|-------|----------------|
   | `JWT_SECRET` | (paste your generated secret from Step 5) | You generated it |
   | `RAILWAY_BUCKET_NAME` | (paste from Step 4) | Railway Bucket settings |
   | `RAILWAY_BUCKET_ENDPOINT` | (paste from Step 4) | Railway Bucket settings |
   | `RAILWAY_BUCKET_ACCESS_KEY` | (paste from Step 4) | Railway Bucket settings |
   | `RAILWAY_BUCKET_SECRET_KEY` | (paste from Step 4) | Railway Bucket settings |
   | `RAILWAY_BUCKET_REGION` | `us-east-1` | Default value |
   | `CORS_ORIGINS` | `*` | Default (allows all origins) |

4. **Note**: `DATABASE_URL` is already set automatically by Railway (from Step 3)

5. **Note**: `PORT` is set automatically by Railway - don't add it manually

---

## Step 7: Set Up Worker Service

Railway needs to run **two processes**:
1. **Web API** (handles HTTP requests)
2. **Worker** (processes render jobs)

### Option A: Using Railway's Process Configuration (Recommended)

1. **In your code service**, go to "Settings" tab
2. **Find "Start Command"** section
3. **Set the start command**:
   - For **Web API**: `npm start` (or leave default)
   - Railway will detect `package.json` scripts automatically

4. **Add a second service for the worker**:
   - Click "New" → "Empty Service"
   - Connect it to the same GitHub repo
   - In the new service, go to "Settings" → "Start Command"
   - Set: `npm run start:worker`
   - Add the same environment variables (copy from main service)

### Option B: Using Railway.json (Already Included)

The repository already includes a `railway.json` file that configures the build process. You just need to:

1. Create two services in Railway pointing to the same repo
2. Set different start commands:
   - **Service 1 (Web API)**: `npm start`
   - **Service 2 (Worker)**: `npm run start:worker`
3. Copy all environment variables to both services

---

## Step 8: Run Database Migrations

After deployment, you need to create the database tables:

1. **In Railway**, click on your **code service**
2. **Go to "Deployments" tab**
3. **Click on the latest deployment** → "View Logs"
4. **Open a shell/terminal** (Railway provides a terminal button)
5. **Run**:
   ```bash
   npx prisma migrate deploy
   ```
   Or if that doesn't work:
   ```bash
   npx prisma db push
   ```

This creates all the database tables (User, ApiKey, Job, Asset).

---

## Step 9: Verify Deployment

1. **Check your service URL**:
   - Railway gives you a URL like `https://your-app.up.railway.app`
   - Test: `https://your-app.up.railway.app/health`
   - Should return: `{"status":"ok"}`

2. **Test registration**:
   ```bash
   curl -X POST https://your-app.up.railway.app/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456"}'
   ```

3. **Test login**:
   ```bash
   curl -X POST https://your-app.up.railway.app/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456"}'
   ```

---

## Step 10: Create Your First API Key

1. **Login** (use the JWT token from Step 9):
   ```bash
   curl -X GET https://your-app.up.railway.app/auth/me \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Create an API key**:
   ```bash
   curl -X POST https://your-app.up.railway.app/dashboard/api-keys \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"My First Key"}'
   ```

3. **Copy the API key** from the response - you'll use this to call `/v1/render`

---

## Troubleshooting

### Database Connection Issues
- **Check**: `DATABASE_URL` is set automatically - don't override it
- **Verify**: Database service shows "Active" in Railway dashboard
- **Fix**: Run migrations (Step 8)

### Bucket Upload Fails
- **Check**: All 5 bucket environment variables are set correctly
- **Verify**: Bucket service shows "Active" in Railway dashboard
- **Check logs**: Look for "Missing bucket configuration" warnings

### Worker Not Processing Jobs
- **Check**: Worker service is running (separate from web service)
- **Verify**: Worker service has all the same environment variables
- **Check logs**: Worker should show "Polling for jobs..." messages

### Build Fails
- **Check**: `package.json` has correct scripts (`start`, `build`)
- **Verify**: TypeScript compiles (`npm run build` works locally)
- **Check logs**: Railway shows build errors in deployment logs

---

## Environment Variables Summary

Here's a quick reference of what you need:

| Variable | Required? | Auto-Set? | Where to Get It |
|----------|-----------|-----------|-----------------|
| `DATABASE_URL` | ✅ Yes | ✅ Yes | Railway Postgres service |
| `JWT_SECRET` | ✅ Yes | ❌ No | Generate yourself (Step 5) |
| `RAILWAY_BUCKET_NAME` | ✅ Yes | ❌ No | Railway Bucket settings |
| `RAILWAY_BUCKET_ENDPOINT` | ✅ Yes | ❌ No | Railway Bucket settings |
| `RAILWAY_BUCKET_ACCESS_KEY` | ✅ Yes | ❌ No | Railway Bucket settings |
| `RAILWAY_BUCKET_SECRET_KEY` | ✅ Yes | ❌ No | Railway Bucket settings |
| `RAILWAY_BUCKET_REGION` | ⚠️ Optional | ❌ No | Default: `us-east-1` |
| `CORS_ORIGINS` | ⚠️ Optional | ❌ No | Default: `*` |
| `PORT` | ⚠️ Optional | ✅ Yes | Railway sets automatically |

---

## Next Steps

Once deployed:
1. ✅ Test the health endpoint
2. ✅ Register a user account
3. ✅ Create an API key
4. ✅ Test a render job with `/v1/render`
5. ✅ Check job status with `/v1/jobs/:id`

See `README.md` for API usage examples!

---

---

## Step 11: Create a Railway Template (Optional - For One-Click Deployment)

After you've successfully deployed and configured everything, you can create a Railway template so others can deploy with one click:

1. **In your Railway project dashboard**, go to "Settings" → "Template" (or look for "Publish Template" option)

2. **Click "Create Template"** or "Publish Template" and fill in:
   - **Template Name**: `Render Video API`
   - **Description**: `Open-source JSON-to-Video API for rendering longform videos`
   - **Repository**: Your GitHub repo URL
   - **Icon** (optional): Upload a logo

3. **Configure template variables**:
   - Railway will detect all your services (web-api, worker, postgres, bucket)
   - Set `JWT_SECRET` as a **required variable** that users must provide during deployment
   - Bucket credentials and `DATABASE_URL` will be auto-generated for each deployment

4. **Publish the template**:
   - Click "Publish Template"
   - Railway will give you a template ID (looks like: `abc123-def456`)

5. **Add "Deploy on Railway" button to README**:
   Update the README.md with your template ID:
   ```markdown
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/YOUR_TEMPLATE_ID)
   ```

### How Template Deployment Works

When someone clicks "Deploy on Railway" with your template:
1. ✅ Railway creates a new project with all services automatically:
   - Web API service (runs `npm start`)
   - Worker service (runs `npm run start:worker`)
   - PostgreSQL database (auto-sets `DATABASE_URL`)
   - Railway Bucket (auto-sets bucket credentials)
2. ✅ User is prompted to set `JWT_SECRET` (only required input)
3. ✅ Railway automatically builds and deploys everything
4. ✅ User just needs to run migrations (Step 8) and they're done!

**This makes deployment a one-click experience!** 🎉

---

## Need Help?

- Check Railway logs: Dashboard → Your Service → Deployments → View Logs
- Check Railway docs: [docs.railway.app](https://docs.railway.app)
- Railway Templates: [docs.railway.com/guides/publish-and-share](https://docs.railway.com/guides/publish-and-share)
- Common issues: See Troubleshooting section above

