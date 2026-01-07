# Setup All Services for Template Creation

This guide walks you through setting up all 4 services (Web API, Worker, Postgres, Bucket) in Railway, testing them, and then creating a template from the working setup.

---

## Overview: What We're Building

Your Railway project will have **4 services**:

1. **web-api** - Main API server (from GitHub repo)
2. **worker** - Background job processor (from same GitHub repo)
3. **postgres** - Database (Railway managed)
4. **bucket** - File storage (Railway managed)

Once all 4 are working together, Railway can create a template that includes all of them!

---

## Step 1: Deploy the Repo (Creates Web API Service)

1. **Go to Railway dashboard**: [railway.app](https://railway.app)
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository**: `juppfy/render-video-api`
5. **Railway will**:
   - Create a service called something like `render-video-api`
   - Start building and deploying
   - This is your **web-api service**

6. **While it's building, configure it**:
   - Go to the service → **Settings** tab
   - **Start Command**: `npm start`
   - **Healthcheck Path**: `/health`
   - **Public Networking**: Enable **HTTP Proxy** (so API is accessible)
   - **Restart Policy**: On Failure, Max retries: 10

**Don't worry about variables yet** - we'll set those after adding all services.

---

## Step 2: Add PostgreSQL Database

1. **In your Railway project**, click **"New"** button
2. **Select "Database"** → **"Add PostgreSQL"**
3. **Railway will**:
   - Create a Postgres service
   - Automatically set `DATABASE_URL` in your web-api service
   - Provision the database (~30-60 seconds)

4. **Verify it's connected**:
   - Go to your web-api service → **Variables** tab
   - You should see `DATABASE_URL` listed (it's a reference from Postgres)
   - ✅ If you see it, database is connected!

**No configuration needed** - Railway handles everything automatically.

---

## Step 3: Add Railway Bucket (Storage)

1. **In your Railway project**, click **"New"** button
2. **Select "Storage"** → **"Add Bucket"**
3. **Railway will**:
   - Create a Bucket service
   - Generate bucket credentials
   - Make them available as environment variables

4. **Check what variables Railway created**:
   - Go to your web-api service → **Variables** tab
   - Look for bucket-related variables
   - Railway might name them:
     - `AWS_ACCESS_KEY_ID` ✅
     - `AWS_SECRET_ACCESS_KEY` ✅
     - `BUCKET_NAME` ✅
     - `BUCKET_ENDPOINT` ✅
   
   **OR** Railway might use different names. Check the Bucket service's Variables tab to see what it exposes.

5. **If you see the variables above, you're good!** The code supports both naming conventions.

6. **If variables aren't auto-set**, you'll need to reference them:
   - In web-api service → Variables tab
   - Click "Reference" or "Add Reference"
   - Select your Bucket service
   - Choose the variable name (e.g., `AWS_ACCESS_KEY_ID`)

---

## Step 4: Add Worker Service

1. **In your Railway project**, click **"New"** button
2. **Select "Empty Service"** (or "GitHub Repo" if that option exists)
3. **Connect it to your GitHub repo**:
   - Select "Deploy from GitHub repo"
   - Choose the same repo: `juppfy/render-video-api`
   - Railway will create a second service from the same repo

4. **Rename it** (optional but helpful):
   - Click on the service name
   - Rename it to `worker` or `render-video-api-worker`

5. **Configure the worker service**:
   - Go to **Settings** tab
   - **Start Command**: `npm run start:worker`
   - **Public Networking**: **Disable** (worker doesn't need to be public)
   - **Restart Policy**: On Failure, Max retries: 10

6. **Set up variables for worker**:
   - Go to **Variables** tab
   - You need the same variables as web-api:
     - `DATABASE_URL` - Should auto-reference from Postgres
     - `JWT_SECRET` - We'll set this next
     - Bucket variables - Should reference from Bucket service
     - `RAILWAY_BUCKET_REGION` = `us-east-1`
     - `CORS_ORIGINS` = `*`

---

## Step 5: Configure Environment Variables

Now set up variables for both web-api and worker services.

### For Web API Service:

1. **Go to web-api service → Variables tab**

2. **Add/Reference these variables**:

   **JWT_SECRET**:
   - Click "New Variable"
   - Name: `JWT_SECRET`
   - Value: Click "Generate" to create a random secret
   - ✅ Save

   **Bucket Variables** (if not auto-set):
   - Click "Reference" or "Add Reference"
   - Select your Bucket service
   - Reference these variables:
     - `AWS_ACCESS_KEY_ID` → Reference from Bucket
     - `AWS_SECRET_ACCESS_KEY` → Reference from Bucket
     - `BUCKET_NAME` → Reference from Bucket
     - `BUCKET_ENDPOINT` → Reference from Bucket
   
   **OR** if Railway uses different names, reference those instead.

   **Optional Variables**:
   - `RAILWAY_BUCKET_REGION` = `us-east-1` (plain value)
   - `CORS_ORIGINS` = `*` (plain value)

3. **Verify `DATABASE_URL` is there** (should be auto-referenced from Postgres)

### For Worker Service:

1. **Go to worker service → Variables tab**

2. **Add the same variables**:
   - **Option A**: Copy each variable manually (same as web-api)
   - **Option B**: Railway might share variables at project level
     - Check **Project Settings → Variables**
     - If variables are there, they're shared automatically

3. **Make sure worker has**:
   - ✅ `DATABASE_URL` (from Postgres)
   - ✅ `JWT_SECRET` (same value as web-api)
   - ✅ All bucket variables (from Bucket service)
   - ✅ `RAILWAY_BUCKET_REGION` = `us-east-1`
   - ✅ `CORS_ORIGINS` = `*`

---

## Step 6: Test Everything Works

### Check Service Status:

1. **All 4 services should show "Active"**:
   - ✅ web-api service
   - ✅ worker service
   - ✅ postgres service
   - ✅ bucket service

### Check Logs:

1. **Web API service logs**:
   - Should show: "API server listening on port..."
   - Should show: "Prisma Client generated"
   - No errors about missing variables

2. **Worker service logs**:
   - Should show: "Polling for jobs..."
   - No errors about missing variables

### Test the API:

1. **Get your web-api URL**:
   - Go to web-api service → Settings → Networking
   - Copy the public URL (e.g., `https://your-app.up.railway.app`)

2. **Test health endpoint**:
   ```bash
   curl https://your-app.up.railway.app/health
   ```
   Should return: `{"status":"ok"}`

3. **Test registration**:
   ```bash
   curl -X POST https://your-app.up.railway.app/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456"}'
   ```
   Should return: `{"message":"User created successfully"}`

4. **Test login**:
   ```bash
   curl -X POST https://your-app.up.railway.app/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456"}'
   ```
   Should return: `{"token":"..."}`

5. **Test worker is processing**:
   - Create a render job (after getting API key)
   - Check worker logs - should show it processing the job

---

## Step 7: Document What Worked

Before creating the template, note down:

1. **Service names**:
   - Web API service name: `_____________`
   - Worker service name: `_____________`

2. **Start commands**:
   - Web API: `npm start` ✅
   - Worker: `npm run start:worker` ✅

3. **Variables that worked**:
   - `DATABASE_URL` - Auto from Postgres ✅
   - `JWT_SECRET` - Generated manually ✅
   - Bucket variables - Names used: `_____________`
   - `RAILWAY_BUCKET_REGION` = `us-east-1` ✅
   - `CORS_ORIGINS` = `*` ✅

4. **Any issues you encountered**:
   - `_____________`
   - `_____________`

5. **What Railway auto-populated**:
   - `_____________`
   - `_____________`

---

## Step 8: Ready for Template Creation!

Once everything is working:

✅ All 4 services are active  
✅ All variables are set  
✅ API is responding  
✅ Worker is processing jobs  
✅ Database is connected  
✅ Bucket is accessible  

**You're ready to create the template!** Railway will capture:
- All 4 services and their configurations
- All environment variables and references
- Start commands
- Service relationships

**Next**: Follow `PUBLISH_TEMPLATE.md` to create the template from this working setup.

---

## Troubleshooting

### Variables Not Showing
- Check Project Settings → Variables (might be project-level)
- Check each service's Variables tab individually
- Bucket variables might be in Bucket service → Variables tab

### Worker Can't Access Database
- Make sure worker has `DATABASE_URL` variable
- Should reference from Postgres service
- Check worker logs for connection errors

### Bucket Upload Fails
- Verify bucket variables are set in both web-api and worker
- Check variable names match what Railway uses
- Look for "Missing bucket configuration" warnings in logs

### Services Not Starting
- Check Start Commands are correct
- Check logs for build errors
- Verify all dependencies are in `package.json`

---

Good luck! Once this works, creating the template will be easy! 🚀

