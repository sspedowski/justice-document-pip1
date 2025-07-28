# 🚀 Justice Dashboard - Quick Start Guide

## ✅ Prerequisites Verified
- Node.js installed ✅
- Environment variables configured ✅
- Dependencies installed ✅

## 🏃‍♂️ Quick Start (5 seconds)

### Option A: Full Stack Development
```bash
cd justice-dashboard
npm run dev
```
This starts both frontend (port 5174) and backend (port 3000)

### Option B: Backend Only
```bash
npm run dev:backend
# OR
node server.js
```

### Option C: Frontend Only (if backend is already running)
```bash
npm run dev:frontend
```

## 🔑 Login Credentials
- **Username**: `admin`
- **Password**: `adminpass`

## 📋 URLs
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 🧪 Validation & Testing
```bash
# Validate environment setup
npm run validate

# Test login endpoint
Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"adminpass"}'
```

## 🛠️ Troubleshooting

### If login fails (401):
1. Check environment variables: `npm run validate`
2. Restart server: `node server.js`
3. Verify credentials in `justice-server/.env`

### If uploads fail:
1. Ensure you're logged in first
2. Check browser console for errors
3. Verify CORS settings in server.js

### If ports are in use:
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Restart
npm run dev
```

## 📁 Project Structure
```
justice-dashboard/
├── server.js                 # Entry point (redirects to justice-server)
├── justice-server/           # Backend API
│   ├── server.js            # Main server file
│   └── .env                 # Environment variables
├── justice-dashboard/        # Frontend
│   └── package.json         # Frontend dependencies
└── scripts/                 # Utility scripts
    ├── setup.sh/.bat        # Setup scripts
    └── validate-env.js       # Environment validation
```

---

## 🎉 Success Indicators

When everything is working, you should see:

1. ✅ Server logs: "Justice server running at http://localhost:3000"
2. ✅ Frontend loads without errors
3. ✅ Login with admin/adminpass succeeds
4. ✅ Upload buttons appear after login
5. ✅ PDF uploads process and show summaries

---

**Happy Coding! 🚀**
