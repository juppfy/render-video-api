# Testing Direct Deployment (Before Creating Template)

This guide helps you test deploying directly from GitHub to Railway first, so you can verify everything works before creating a template.

---

## What Happens When You Deploy Directly

When you deploy a GitHub repo directly to Railway:

✅ **Railway will:**
- Create ONE service from your repo
- Auto-detect it's a Node.js project
- Build and deploy it
- Set `PORT` automatically

❌ **Railway will NOT:**
- Automatically create worker service
- Automatically create Postgres database
- Automatically create Bucket storage
- Set up environment variables

**You need to add these manually** - but this is perfect for testing!

---

## Step-by-Step Direct Deployment Test

### Step 1: Deploy the Repo

1. **Go to Railway dashboard**
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your `render-video-api` repository**
5. **Railway will create one service** and start deploying

### Step 2: Add Postgres Database

1. **In your Railway project**, click "New" → "Database" → "Add PostgreSQL"
2. **Railway automatically sets `DATABASE_URL`** in your service
3. **Wait for it to provision** (~30 seconds)

### Step 3: Add Railway Bucket

1. **Click "New" → "Storage" → "Add Bucket"**
2. **Railway creates the bucket**
3. **Note**: Railway Bucket variables might be named:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `BUCKET_NAME`
   - `BUCKET_ENDPOINT`

### Step 4: Configure the Main Service

1. **Go to your main service** (the one from GitHub)
2. **Settings tab**:
   - **Start Command**: `npm start`
   - **Healthcheck Path**: `/health`
   - **Public Networking**: Enable HTTP Proxy
   - **Restart Policy**: On Failure, Max retries: 10

3. **Variables tab**:
   - `JWT_SECRET`: Click "Generate" to create a random secret
   - `RAILWAY_BUCKET_REGION`: Set to `us-east-1`
   - `CORS_ORIGINS`: Set to `*`
   
   **For bucket variables**, Railway might have already set them. Check if you see:
   - `AWS_ACCESS_KEY_ID` (from Bucket service)
   - `AWS_SECRET_ACCESS_KEY` (from Bucket service)
   - `BUCKET_NAME` (from Bucket service)
   - `BUCKET_ENDPOINT` (from Bucket service)
   
   If you see these, **you're good!** The code supports both naming conventions.
   
   If you don't see them, you may need to reference them:
   - Click "Reference" → Select Bucket service → Choose the variable

### Step 5: Add Worker Service

1. **Click "New" → "Empty Service"**
2. **Connect it to the same GitHub repo** (`juppfy/render-video-api`)
3. **Settings tab**:
   - **Start Command**: `npm run start:worker`
   - **Public Networking**: Disable
   - **Restart Policy**: On Failure, Max retries: 10

4. **Variables tab**:
   - Copy all the same variables from the main service
   - Or Railway might share them automatically (check Project Settings → Variables)

### Step 6: Test the Deployment

1. **Wait for both services to deploy** (~3-5 minutes)
2. **Check the main service URL**: `https://your-app.up.railway.app/health`
   - Should return: `{"status":"ok"}`
3. **Check logs**:
   - Main service: Should show "API server listening on port..."
   - Worker service: Should show "Polling for jobs..."
4. **Test registration**:
   ```bash
   curl -X POST https://your-app.up.railway.app/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456"}'
   ```

### Step 7: Verify Everything Works

✅ **Checklist:**
- [ ] Main service is running and accessible
- [ ] Worker service is running (check logs)
- [ ] Database connection works (no errors in logs)
- [ ] Can register a user
- [ ] Can login and get JWT token
- [ ] Can create an API key
- [ ] Can create a render job (test with a simple one)

---

## What to Look For

### ✅ Good Signs:
- Both services deploy successfully
- No errors in logs about missing variables
- Health endpoint returns `{"status":"ok"}`
- Worker shows "Polling for jobs..." messages

### ⚠️ Issues to Fix:

**"Missing bucket configuration" warning:**
- Bucket variables aren't set
- Check Variables tab → Reference from Bucket service
- Or check if Railway used different variable names

**Database connection errors:**
- `DATABASE_URL` might not be set
- Check Variables tab → Should see `DATABASE_URL` as a reference from Postgres

**Worker not processing jobs:**
- Worker service might not have the same variables
- Copy variables from main service to worker
- Or set them at Project level

---

## After Testing - Create the Template

Once everything works with direct deployment:

1. ✅ All services are running
2. ✅ All variables are set correctly
3. ✅ Everything is tested and working

**Then** you can create the template, and Railway will:
- Capture all your service configurations
- Capture all your variable settings
- Make it one-click deployable for others

---

## Quick Reference: What Gets Auto-Created vs Manual

| Service/Setting | Direct Deploy | Template Deploy |
|----------------|---------------|-----------------|
| Main service from repo | ✅ Auto | ✅ Auto |
| Postgres database | ❌ Manual | ✅ Auto |
| Railway Bucket | ❌ Manual | ✅ Auto |
| Worker service | ❌ Manual | ✅ Auto |
| Environment variables | ❌ Manual | ✅ Auto (from template) |
| Start commands | ⚠️ Auto-detected | ✅ From template |

**Direct deploy = Test everything manually first**  
**Template deploy = One-click with everything pre-configured**

---

## Next Steps

1. Test direct deployment (follow steps above)
2. Fix any issues you find
3. Once everything works, create the template
4. Template will have all the correct settings!

Good luck! 🚀

