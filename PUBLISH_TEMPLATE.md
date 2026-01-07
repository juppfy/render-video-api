# How to Publish Your Railway Template

This guide walks you through creating and publishing a Railway template so others can deploy your Render Video API with one click.

## Prerequisites

- ✅ You have successfully deployed Render Video API on Railway (followed DEPLOYMENT.md Steps 1-9)
- ✅ All services are running (web-api, worker, postgres, bucket)
- ✅ Your deployment is working correctly

---

## Step 1: Navigate to Template Settings

1. **Go to your Railway project dashboard**
2. **Click on your project name** (top left)
3. **Go to "Settings"** tab
4. **Scroll down to find "Template" section** (or look for "Publish Template" / "Create Template" button)

---

## Step 2: Create the Template

1. **Click "Create Template"** or **"Publish Template"** button

2. **Fill in the template details**:

   - **Template Name**: `Render Video API`
   - **Short Description**: `Deploy and Host Render Video API with Railway`
   - **Template Overview**: Copy the content from `TEMPLATE_DESCRIPTION.md` (the full overview section)
   - **Repository URL**: `https://github.com/juppfy/render-video-api` (or your fork URL)
   - **Icon** (optional): Upload a logo/image if you have one

3. **Railway will automatically detect**:
   - ✅ All your services (web-api, worker, postgres, bucket)
   - ✅ Service configurations and start commands
   - ✅ Environment variable references

---

## Step 3: Configure Service Settings

Before creating the template, configure each service's settings:

### For Web API Service:

1. **Go to your web-api service** (the main service)
2. **Click "Settings" tab**
3. **Configure these settings**:

   - **Start Command**: `npm start` (this runs migrations automatically)
   - **Pre-deploy Command** (optional): Leave empty or set to `npm run build`
   - **Healthcheck Path**: `/health`
   - **Public Networking**: Enable HTTP Proxy (so API is accessible)
   - **Restart Policy**: On Failure, Max retries: 10

### For Worker Service:

1. **Go to your worker service**
2. **Click "Settings" tab**
3. **Configure these settings**:

   - **Start Command**: `npm run start:worker`
   - **Public Networking**: Disable (worker doesn't need to be public)
   - **Restart Policy**: On Failure, Max retries: 10

### For Postgres and Bucket:

- These are **auto-configured** by Railway
- No manual settings needed

---

## Step 4: Set Up Environment Variables (Before Template Creation)

**Important**: Set up environment variables in your actual services FIRST, then Railway will include them in the template.

### In Web API Service:

1. **Go to web-api service → "Variables" tab**
2. **Add/Reference these variables**:

   - `JWT_SECRET`: Click "Generate" or "New Variable" → Generate a secret (Railway will remember this pattern)
   - `RAILWAY_BUCKET_NAME`: Click "Reference" → Select your Bucket service → Choose bucket name variable
   - `RAILWAY_BUCKET_ENDPOINT`: Reference from Bucket service
   - `RAILWAY_BUCKET_ACCESS_KEY`: Reference from Bucket service (might be `AWS_ACCESS_KEY_ID`) ${{AWS_ACCESS_KEY_ID}} 
   - `RAILWAY_BUCKET_SECRET_KEY`: Reference from Bucket service (might be `${{AWS_SECRET_ACCESS_KEY}}  AWS_SECRET_ACCESS_KEY`)
   - `RAILWAY_BUCKET_REGION`: Set value to `us-east-1`
   - `CORS_ORIGINS`: Set value to `*`

3. **`DATABASE_URL` is automatically set** by Railway from Postgres service (you'll see it as a reference)

### In Worker Service:

1. **Go to worker service → "Variables" tab**
2. **Copy all the same variables** from web-api service (or reference them)

**Note**: The variables you see (`RAILWAY_PROJECT_NAME`, etc.) are Railway's built-in variables. You need to ADD your custom variables (`JWT_SECRET`, bucket vars, etc.) manually.

---

## Step 5: Create the Template

Now that your services are configured, create the template:

1. **Go to Project Settings → Template section**
2. **Click "Create Template"** or **"Publish Template"**
3. **Fill in template details**:
   - **Template Name**: `Render Video API`
   - **Short Description**: `Deploy and Host Render Video API with Railway`
   - **Overview**: Copy from `TEMPLATE_DESCRIPTION.md`
   - **Repository**: `juppfy/render-video-api` (or your repo)

4. **Railway will detect**:
   - All your services and their configurations
   - Environment variables you've set up
   - Start commands and settings

5. **In the template configuration**, look for variable settings:
   - Find `JWT_SECRET` and set it to **"Generate"** or **"Auto-generate"**
   - Other variables should be marked as **"Reference"** from their respective services

---

## Step 6: Publish the Template

1. **Review the template configuration** Railway shows you
2. **Verify**:
   - All 4 services are included (web-api, worker, postgres, bucket)
   - Start commands are correct
   - Variables are properly configured
3. **Click "Publish Template"** or **"Create Template"**
4. **Railway will process and publish your template**
5. **You'll receive a Template ID** (looks like: `abc123-def456-ghi789`)

**Save this Template ID!** You'll need it for the deploy button.

---

## Important Notes About Railway Template Variables

**What you're seeing** (`RAILWAY_PROJECT_NAME`, etc.) are Railway's **built-in system variables**. These are automatically available and you don't need to configure them.

**What you need to do**:
1. **Add your custom variables** (`JWT_SECRET`, bucket vars) in the actual services FIRST
2. **Then** Railway will detect them when creating the template
3. **In the template**, configure `JWT_SECRET` to auto-generate
4. **Other variables** will be auto-referenced from services

If Railway's template UI doesn't show variable configuration options, it means Railway will:
- Auto-detect variables from your services
- Auto-generate secrets where needed
- Auto-reference service variables

This is actually better - Railway handles everything automatically!

---

## Step 7: Update Your README with Deploy Button

1. **Open your GitHub repository**
2. **Edit `README.md`**
3. **Find the deploy button section** (near the top)
4. **Replace the placeholder URL** with your actual template ID:

   ```markdown
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/YOUR_TEMPLATE_ID)
   ```

   Replace `YOUR_TEMPLATE_ID` with the ID Railway gave you.

5. **Commit and push** the change

---

## Step 8: Test the Template (Important!)

Before sharing, test that the template works:

1. **Open an incognito/private browser window**
2. **Click your "Deploy on Railway" button** from the README
3. **Follow the deployment process**:
   - Railway should create all services automatically
   - No prompts for `JWT_SECRET` (it's auto-generated)
   - Everything should deploy and start automatically
4. **Wait for deployment to complete** (~3-5 minutes)
5. **Test the API**:
   - Visit `https://your-new-app.up.railway.app/health`
   - Should return `{"status":"ok"}`
6. **Register a user and create an API key** to verify everything works

If everything works, your template is ready! 🎉

---

## Step 9: Share Your Template

Now others can:

1. **Click the "Deploy on Railway" button** in your README
2. **Railway creates everything automatically**
3. **Wait for deployment** (~3-5 minutes)
4. **Start using the API immediately**

No configuration, no manual steps, just click and deploy!

---

## Troubleshooting

### Template Not Appearing
- Make sure you clicked "Publish" (not just "Save")
- Check that all services are properly configured
- Verify your Railway account has template publishing permissions

### Deployments Fail
- Check that `JWT_SECRET` is set to auto-generate
- Verify bucket variables are properly referenced
- Ensure start commands are correct (`npm start` for web-api, `npm run start:worker` for worker)

### Template ID Not Working
- Double-check the Template ID from Railway dashboard
- Make sure the URL format is: `https://railway.app/new/template/YOUR_TEMPLATE_ID`
- Try the template link directly in Railway dashboard first

---

## Next Steps

Once your template is published:

1. ✅ Update README with your template ID
2. ✅ Test the template deployment
3. ✅ Share your repository with others
4. ✅ Others can now one-click deploy!

Your Render Video API is now available as a one-click Railway template! 🚀

