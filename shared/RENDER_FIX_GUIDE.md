# 🔧 Render Deployment Fix - Express Module Issue

## ❌ **Problem Identified:**

```
Error: Cannot find module 'express'
Require stack:
- /opt/render/project/src/justice-server/server.js
- /opt/render/project/src/server.js
```

This happens because Render isn't installing dependencies in the `justice-server/` subdirectory.

## ✅ **Solution: Updated Render Configuration**

### 1. **Use the new `render.yaml` file** (automatically detected by Render)

The project now includes a `render.yaml` with proper monorepo build commands:

```yaml
buildCommand: |
  npm install
  cd justice-server && npm install  
  cd ../justice-dashboard && npm install
```

### 2. **Alternative: Manual Render Settings**

If not using `render.yaml`, set these in Render dashboard:

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**
- `NODE_ENV` = `production`
- `JWT_SECRET` = (generate 32+ char secret)
- `SESSION_SECRET` = (generate 32+ char secret)  
- `ADMIN_USERNAME` = `admin`
- `ADMIN_PASSWORD` = (your secure password)
- `OPENAI_API_KEY` = (your OpenAI key)

### 3. **Quick Fix Option**

If you want to deploy immediately without changing Render settings:

**Update your Render Build Command to:**
```bash
npm install && cd justice-server && npm install && cd .. && echo "Build complete"
```

**Keep Start Command as:**
```bash
npm start
```

## 🚀 **Expected Result:**

After this fix, your Render deployment should show:

```
🚀 Installing Justice Dashboard dependencies...
📦 Installing backend dependencies...  
📦 Installing frontend dependencies...
✅ Build complete!
✅ Justice server running at http://localhost:3000
```

## 🔍 **Verification Steps:**

1. **Redeploy on Render** - Either push new commit or manual redeploy
2. **Check build logs** - Should see all three npm install commands
3. **Test endpoints:**
   - Health: `https://your-app.render.com/api/health`
   - Login: `https://your-app.render.com/api/login`

## 🎯 **Root Cause:**

Monorepo projects need **explicit dependency installation** for each subproject. Standard `npm install` only installs root dependencies, not subdirectory packages.

---

## 🚀 **Next Steps:**

1. **Push these changes** to trigger new Render deployment
2. **Monitor build logs** to confirm all dependencies install
3. **Test live endpoints** once deployment succeeds

Your Justice Dashboard will be live in ~3-5 minutes! 🌟
