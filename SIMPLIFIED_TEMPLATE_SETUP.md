# Simplified Railway Template Setup

## The Simple Truth: Railway Auto-Populates Most Variables! 🎉

You're right to be confused - **Railway CAN auto-populate variables!** Here's the simple way:

---

## What Railway Auto-Populates

When you create a template, Railway automatically:

1. ✅ **`DATABASE_URL`** - Auto-set from Postgres service
2. ✅ **Bucket variables** - If you use Railway's standard names, they auto-populate:
   - `AWS_ACCESS_KEY_ID` (Railway's standard name)
   - `AWS_SECRET_ACCESS_KEY` (Railway's standard name)
   - `BUCKET_NAME` (Railway's standard name)
   - `BUCKET_ENDPOINT` (Railway's standard name)
3. ✅ **`JWT_SECRET`** - Can be auto-generated in template settings
4. ✅ **`PORT`** - Auto-set by Railway

---

## Simple Setup Steps

### Step 1: Configure Service Settings Only

**For Web API Service:**
- Start Command: `npm start`
- Healthcheck Path: `/health`
- Public Networking: Enable HTTP Proxy
- Restart Policy: On Failure, Max retries: 10

**For Worker Service:**
- Start Command: `npm run start:worker`
- Public Networking: Disable
- Restart Policy: On Failure, Max retries: 10

**That's it for settings!** No variables needed here.

---

### Step 2: Variables Are Auto-Populated (No Manual Setup Needed!)

**Good news**: I've updated the code to use Railway's standard variable names, so:

- ✅ **Bucket variables** will auto-populate from the Bucket service
- ✅ **Database URL** auto-populates from Postgres
- ✅ **JWT_SECRET** can be auto-generated in template

**You don't need to manually add variables!** Railway handles it.

---

### Step 3: About Worker Service Variables

**If you can't see worker service variables tab:**

Railway has two ways variables work:

1. **Project-level variables** (shared by all services)
2. **Service-level variables** (specific to one service)

**Solution**: 
- Variables are often **shared at the project level**
- Go to **Project Settings → Variables** (not service-specific)
- Or Railway will auto-share variables between services in templates

**For templates**: Railway will automatically share variables between web-api and worker services.

---

### Step 4: Create the Template

1. **Go to Project Settings → Template**
2. **Click "Create Template"**
3. **Fill in**:
   - Name: `Render Video API`
   - Description: `Deploy and Host Render Video API with Railway`
   - Overview: Copy from `TEMPLATE_DESCRIPTION.md`
   - Repository: `juppfy/render-video-api`

4. **Railway will show you services and variables**
   - If you see variable options, set `JWT_SECRET` to "Generate"
   - If you don't see variable options, that's fine - Railway auto-handles them

5. **Click "Publish Template"**
6. **Get your Template ID**

---

## What Changed in the Code

I updated `src/modules/assets/railwayBucket.ts` to support **both**:
- Custom names: `RAILWAY_BUCKET_ACCESS_KEY`
- Railway standard names: `AWS_ACCESS_KEY_ID` (auto-populated)

This means Railway's auto-populated variables will work automatically!

---

## Summary

**You don't need to manually set up variables!**

1. ✅ Configure service settings (Start Command, Healthcheck, etc.)
2. ✅ Create the template - Railway detects everything
3. ✅ Railway auto-populates bucket variables using standard names
4. ✅ Railway auto-generates JWT_SECRET if configured
5. ✅ Variables are shared between services automatically

**That's it!** Railway handles the rest. 🚀

---

## If Variables Still Don't Auto-Populate

If Railway doesn't auto-populate bucket variables in the template:

1. **In template creation**, look for variable configuration
2. **Set bucket variables to "Reference from Bucket service"**
3. **Set JWT_SECRET to "Generate"**

But with the code update, Railway's standard variable names should work automatically!

