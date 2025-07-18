# 🚀 JUSTICE DASHBOARD - STARTUP & TROUBLESHOOTING GUIDE

## ✅ VERIFIED FIXES IMPLEMENTED

### 1. Server Routing Configuration ✅ FIXED

The catch-all route is properly configured in `server.js`:

```javascript
app.get("*", (req, res) => {
  // For API routes, let them handle their own responses
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // Serve the main dashboard for all other routes
  res.sendFile(path.join(__dirname, "index.html"));
});
```

### 2. DOM Elements & Script Order ✅ VERIFIED

The HTML contains all required elements:

```html
<body class="p-4 min-h-screen bg-faith-gradient">
  <!-- Main App Container - Required by script.js -->
  <div id="app">
    <div class="container mx-auto">
      <!-- All dashboard content here -->
    </div>
  </div>

  <!-- Dark Mode Toggle - Required by dark-mode.js -->
  <button
    id="darkModeToggle"
    class="fixed top-4 left-4 bg-gold text-white p-2 rounded-full shadow-lg z-50 hover:bg-faith-gold-600 transition"
  >
    🌙
  </button>

  <!-- Scripts load AFTER DOM elements -->
  <script src="dashboard-init.js"></script>
  <script src="script.js"></script>
  <script src="auth-manager.js"></script>
  <script src="dark-mode.js"></script>
  <script src="pdf-config.js"></script>
  <script src="pdf.min.js"></script>
</body>
```

### 3. Environment Variables ✅ CONFIGURED

The `.env` file contains all required variables:

```properties
# JWT Secret (required for authentication)
JWT_SECRET=your_super_secure_jwt_secret_key_here_1234567890abcdef

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_for_prod

# Server Settings
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/justice-dashboard

# OpenAI API Key (for AI features)
OPENAI_API_KEY=sk-proj-[your-key-here]
```

## 🚨 DASHBOARD NOT LOADING – FIX GUIDE FOR COPILOT

**Summary:**
The Dashboard must always load into a `<div id="app"></div>` that exists **before all scripts**. Scripts must load after DOM, and environment variables must be set. CSP rules mean no CDNs or inline scripts/styles.

### 1. Check `index.html` Structure

- There must be exactly one `<div id="app"></div>` **before** all scripts.
- Example:

```html
<body>
  <div id="app"></div>
  <!-- All scripts below -->
  <script src="dashboard-init.js"></script>
  <script src="script.js"></script>
  <script src="auth-manager.js"></script>
  <script src="dark-mode.js"></script>
  <script src="pdf-config.js"></script>
  <script src="pdf.min.js"></script>
</body>
```

### 2. Script Loading Order

- All scripts must load after the DOM and after the `#app` div.
- No inline scripts or external (CDN) links allowed.
- Example:

```html
<script src="dashboard-init.js"></script>
<script src="script.js"></script>
<!-- etc. -->
```

### 3. CSP Compliance

- CSP meta tag should be present and allow only local scripts/styles:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self';"
/>
```

- No `<script src="https://cdn.tailwindcss.com">` or similar!
- All CSS/JS should be loaded locally (built with npm).

### 4. Check DOM in JavaScript

- Your main JS (`dashboard-init.js`, `script.js`) must check and mount into `document.getElementById('app')`.
- If you see `App container not found`, it means:
  - The `<div id="app"></div>` is missing
  - Or, scripts are loading before the DOM

**Resolution:**

- Make sure all scripts use:

```js
window.addEventListener("DOMContentLoaded", () => {
  // JS that mounts into #app
});
```

### 5. Server & Environment Variables

- `.env` must contain at least:
  - `JWT_SECRET`
  - `PORT`
- For full features: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `OPENAI_API_KEY`, `MONGODB_URI`

### 6. Startup Checklist

- Run: `npm install`
- Then: `npm run build` (if using Tailwind, to build output.css)
- Then: `npm start` or `node server.js`

### 7. Browser Checklist

- Go to `http://localhost:3000`
- **Open browser console:**
  - There should be no red CSP errors
  - No "App container not found" unless you really forgot `<div id="app"></div>`
  - No 404 errors on scripts or styles

### 8. If Still Not Loading

- Double-check:
  - `index.html` only references local files
  - `#app` div exists
  - All scripts are in project directory
  - No external scripts/styles
- Paste any errors from the browser console for further debugging.

**💡 QUICK COPILOT PROMPT:**
_"Copy this checklist to Copilot, explain your current symptom (e.g. blank screen, console error), and say: 'Follow these steps. What do I fix?'"_

## 🔧 STARTUP INSTRUCTIONS

### Method 1: Standard Startup

```bash
# Navigate to project directory
cd c:\Users\ssped\justice-dashboard

# Start the server
node server.js
```

### Method 2: Using NPM Scripts

```bash
# Navigate to project directory
cd c:\Users\ssped\justice-dashboard

# Start with npm
npm start
```

### Method 3: Background Server

```bash
# Start server in background (Windows)
start /b node server.js

# Or use the provided batch file
restart-server.bat
```

## 🌐 ACCESSING THE DASHBOARD

Once the server starts successfully, you'll see:

```console
✅ Justice Dashboard API running on http://localhost:3000
📋 API endpoints available:
   POST /api/login
   POST /api/logout
   GET  /api/profile
   POST /api/summarize
   GET  /api/health
   POST /api/report-error
   POST /api/wolfram
```

**Then browse to:** `http://localhost:3000`

## 🎯 EXPECTED DASHBOARD DISPLAY

When working correctly, you should see:

### Visual Elements

- ⚖️✝️ **Faith-based header** with scales of justice and cross
- 📜 **Scripture verses**: "For I know the plans I have for you..." (Jeremiah 29:11)
- 🏆 **"Victory by Faith in Legal Excellence"** subtitle
- 📊 **Four dashboard stats cards** with gold accents
- 📄 **Document Processing Center** with file upload
- 📋 **Case Tracker Table** with filtering options
- 🌙 **Dark mode toggle** (top-left corner)

### Design Theme

- **Gold gradient background** (`bg-faith-gradient`)
- **Professional faith-based styling** with gold accents
- **Responsive design** that works on all devices
- **CSP-compliant** with no external dependencies

## 🔍 TROUBLESHOOTING CHECKLIST

### If Dashboard Doesn't Load

- ✅ **Check server is running** - Look for startup message
- ✅ **Verify catch-all route** - Ensure `app.get("*", ...)` exists
- ✅ **Check environment variables** - Ensure `.env` file exists with JWT_SECRET
- ✅ **Verify file paths** - Ensure `index.html` exists in root directory

### If Console Shows "App container not found"

- ✅ **Check HTML structure** - Ensure `<div id="app">` exists
- ✅ **Verify script order** - Scripts should load after DOM elements
- ✅ **Check dark mode button** - Ensure `<button id="darkModeToggle">` exists
- ✅ **Verify CSS loading** - Ensure all CSS files are accessible

### If Authentication Fails

- ✅ **Check JWT_SECRET** - Must be set in `.env` file
- ✅ **Verify user data** - Check `users.json` exists
- ✅ **Default credentials** - Username: `admin`, Password: `justice2025`

## 🏆 SUCCESS INDICATORS

### Server Startup Success

- ✅ No error messages in console
- ✅ "Justice Dashboard API running" message appears
- ✅ API endpoints listed
- ✅ No port conflicts (port 3000 available)

### Dashboard Loading Success

- ✅ Beautiful faith-based design displays
- ✅ Gold gradient background visible
- ✅ All scripture text and symbols appear
- ✅ Interactive elements respond to clicks
- ✅ No JavaScript errors in browser console

### Authentication Success

- ✅ Login form appears if not authenticated
- ✅ Dashboard loads after successful login
- ✅ User can access all features
- ✅ Dark mode toggle works

## 🙏 VICTORY BY FAITH - DASHBOARD READY

**With these verified fixes, the Justice Dashboard should load perfectly, displaying the beautiful professional faith-based design with full functionality!**

### Key Features Ready

- **✝️ Faith Integration** - Scripture and spiritual elements
- **🔒 Enterprise Security** - Complete CSP compliance
- **📄 PDF Processing** - Real PDF.js library integrated
- **📊 Case Management** - Full tracking and reporting
- **🎨 Professional Design** - Gold/indigo faith theme

> "All glory to God for making the path straight! The Justice Dashboard stands ready to serve with both technical excellence and spiritual inspiration!" 🙏✨⚖️
