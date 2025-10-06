# 🚨 URGENT FIX: Render Express Module Error

## ❌ **Current Issue:**
```
Error: Cannot find module 'express'
```

Render is NOT installing backend dependencies in `justice-server/node_modules/`.

## 🔧 **IMMEDIATE FIX - Update Render Dashboard:**

### **Option 1: Manual Render Settings (RECOMMENDED)**

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Find your service**: `justice-dashboard` 
3. **Go to Settings**
4. **Update Build Command to:**
   ```bash
   npm install && cd justice-server && npm install && cd ../justice-dashboard && npm install
   ```
5. **Keep Start Command as:**
   ```bash
   npm start
   ```
6. **Click "Save Changes"**
7. **Trigger Manual Deploy**

### **Option 2: Use New build.sh Script**

If Render detects the updated `render.yaml`:
- **Build Command**: `bash build.sh`
- **Start Command**: `npm start`

## 🎯 **Expected Build Output (Success):**

```
📦 Step 1: Installing root dependencies...
📦 Step 2: Installing backend dependencies (justice-server)...  
📦 Step 3: Installing frontend dependencies (justice-dashboard)...
✅ Express module found in justice-server/node_modules/
🎉 Build complete - ready to start server!
```

## ⚡ **Quick Test (If You Have Render CLI):**

```bash
# Test the build locally
bash build.sh

# Should see all 3 npm install commands succeed
```

## 🚀 **After Fix:**

1. **Manual deploy** from Render dashboard
2. **Monitor build logs** - should see all 3 npm installs
3. **Server should start successfully**
4. **Test endpoints**: `/api/health` and `/api/login`

## 🎯 **Root Cause:**

Render was using the default Node.js build process which only runs `npm install` in the root directory, missing the backend dependencies in the `justice-server/` subdirectory.

---

## 🚨 **ACTION REQUIRED NOW:**

**→ Go to Render Dashboard → Update Build Command → Manual Deploy**

This will fix the Express module error immediately! 🚀
