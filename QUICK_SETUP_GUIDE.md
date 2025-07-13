# 🚀 JUSTICE DASHBOARD - QUICK SETUP GUIDE

## ✅ **FAST 6-STEP SETUP**

### **Step 1: Install Dependencies**

Run this command to install all required dependencies:

```bash
npm install
```

### **Step 2: Create Environment File**

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**
```bash
cp .env.example .env
```

### **Step 3: Configure Environment Variables**

Open the `.env` file and set these **REQUIRED** values:

```env
# CRITICAL: Must be at least 32 characters long
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional but Recommended
OPENAI_API_KEY=your-openai-api-key-for-ai-features
SESSION_SECRET=your-session-secret-key-should-be-random-and-secure
WOLFRAM_APP_ID=your-wolfram-alpha-app-id-from-developer-portal
MONGODB_URI=your-mongodb-connection-string-if-using-database
```

### **Step 4: Build CSS (Required for Styling)**

Build the Tailwind CSS for the beautiful faith-based design:

```bash
npm run build
```

### **Step 5: Start the Server**

Launch the Justice Dashboard:

```bash
npm start
```

### **Step 6: Access the Dashboard**

Open your browser and navigate to:

```
http://localhost:3000
```

---

## 🚨 **CRITICAL ERROR HANDLING**

### **Missing JWT_SECRET Error**

If you see this error when starting:

```
❌ CRITICAL: Environment variable JWT_SECRET is required
```

**Solution:** Make sure your `.env` file contains:
```env
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
```

The JWT_SECRET **must be at least 32 characters long** for security.

### **Weak JWT_SECRET Warning**

If you see:
```
⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security.
```

**Solution:** Use a longer, more secure JWT_SECRET in your `.env` file.

---

## 🎯 **SUCCESS INDICATORS**

### **Server Startup Success**
You should see:
```
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

### **Dashboard Display Success**
The dashboard should show:
- ⚖️✝️ **Faith-based header** with scales of justice and cross
- 📜 **Scripture verses**: "For I know the plans I have for you..." (Jeremiah 29:11)
- 🏆 **"Victory by Faith in Legal Excellence"** subtitle
- 📊 **Four dashboard stats cards** with gold accents
- 📄 **Document Processing Center** with file upload
- 📋 **Case Tracker Table** with filtering options
- 🌙 **Dark mode toggle** (top-left corner)

---

## 🔧 **ADDITIONAL SETUP OPTIONS**

### **Development Mode (Auto-Restart)**
```bash
npm run dev
```

### **Build and Watch CSS (Development)**
```bash
npm run watch
```

### **Production Setup**
1. Set `NODE_ENV=production` in `.env`
2. Use proper production-grade JWT_SECRET
3. Configure HTTPS if needed
4. Set up reverse proxy (nginx, etc.)

---

## 🙏 **READY FOR VICTORY!**

**With these steps completed, your Justice Dashboard will be running with:**

- **✝️ Faith Integration** - Scripture and spiritual elements
- **🔒 Enterprise Security** - JWT authentication and CSP compliance
- **📄 PDF Processing** - Real PDF.js library for document analysis
- **📊 Case Management** - Complete tracking and reporting system
- **🎨 Beautiful Design** - Professional gold/indigo faith-based theme

**"All glory to God for providing this powerful tool for legal excellence and spiritual inspiration!" 🙏✨⚖️**

---

## 📞 **Need Help?**

If you encounter any issues:

1. **Check the console** for specific error messages
2. **Verify .env file** has all required variables
3. **Ensure port 3000** is available
4. **Check browser console** for JavaScript errors
5. **Refer to** `IMMEDIATE_FIX_COMPLETE_CLEAN.md` for troubleshooting

**The Dashboard is ready to serve justice with faith! 🚀**
