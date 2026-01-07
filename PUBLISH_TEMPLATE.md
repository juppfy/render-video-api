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

## Step 3: Configure Template Variables

Railway will show you all the environment variables. Configure them:

1. **For `JWT_SECRET`**:
   - Set it to **"Auto-generate"** or **"Secret Generator"**
   - This ensures Railway creates a random secret for each deployment
   - Users won't need to provide this

2. **For bucket variables** (`RAILWAY_BUCKET_NAME`, `RAILWAY_BUCKET_ENDPOINT`, etc.):
   - These should be **auto-referenced** from the Bucket service
   - Railway will handle this automatically

3. **For `DATABASE_URL`**:
   - This is **auto-set** by the Postgres service
   - No configuration needed

4. **For optional variables** (`CORS_ORIGINS`, `RAILWAY_BUCKET_REGION`):
   - Set defaults: `CORS_ORIGINS = *`, `RAILWAY_BUCKET_REGION = us-east-1`

---

## Step 4: Review Service Configuration

Railway will show you the services that will be created:

1. **web-api service**:
   - Source: Your GitHub repo
   - Start Command: `npm start` (which runs migrations then starts server)
   - ✅ Correct

2. **worker service**:
   - Source: Your GitHub repo
   - Start Command: `npm run start:worker`
   - ✅ Correct

3. **postgres service**:
   - Type: PostgreSQL
   - ✅ Auto-provisioned

4. **bucket service**:
   - Type: Railway Bucket
   - ✅ Auto-provisioned

**Verify all services look correct**, then proceed.

---

## Step 5: Publish the Template

1. **Click "Publish Template"** or **"Create Template"** button
2. **Railway will process and publish your template**
3. **You'll receive a Template ID** (looks like: `abc123-def456-ghi789`)

**Save this Template ID!** You'll need it for the deploy button.

---

## Step 6: Update Your README with Deploy Button

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

## Step 7: Test the Template (Important!)

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

## Step 8: Share Your Template

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

