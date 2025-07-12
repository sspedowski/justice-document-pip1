# Justice Dashboard - Quick Start Guide

**Get up and running in 5 minutes!**

---

## Prerequisites

- Node.js 16+ installed
- Git installed
- Text editor (VS Code recommended)

---

## 🚀 Quick Setup (5 Steps)

### 1. **Clone & Install**
```bash
git clone https://github.com/sspedowski/justice-dashboard.git
cd justice-dashboard
npm install
```

### 2. **Environment Setup**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your values (minimum required):
# JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
```

### 3. **Start the Server**
```bash
npm start
# or
node server.js
```

### 4. **Access the Application**
- Open: http://localhost:3000
- Default login: `admin` / `justice2025`

### 5. **Verify Everything Works**
- ✅ Login page loads without CSP errors
- ✅ Authentication works
- ✅ Dashboard loads with all controls
- ✅ No console errors about missing DOM elements

---

## 📁 Project Structure

```
justice-dashboard/
├── server.js              # Main Express server
├── script.js              # Frontend dashboard logic
├── login.js               # Login page logic
├── index.html             # Main dashboard page
├── login.html             # Login page
├── config.js              # API configuration
├── style.css              # Custom styles
├── output.css             # Tailwind CSS build
├── users.json             # User storage (file-based)
├── .env.example           # Environment template
└── package.json           # Dependencies
```

---

## 🔧 Development Tips

### **Adding New Features:**
1. Follow CSP compliance (no inline scripts/styles)
2. Use external .js/.css files only
3. Add DOM elements to index.html before accessing in script.js

### **Security Best Practices:**
1. Always set strong environment variables
2. Never commit .env files
3. Test with production CSP settings

### **Common Issues & Solutions:**

**🚫 "Could not find tracker table body"**
- ✅ Make sure all required DOM elements exist in index.html

**🚫 CSP violations in browser console**
- ✅ Remove any inline styles or scripts
- ✅ Use external files only

**🚫 Authentication not working**
- ✅ Check JWT_SECRET is set in .env
- ✅ Verify user credentials in users.json

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | User authentication |
| POST | `/api/logout` | User logout |
| GET | `/api/profile` | Get user profile |
| POST | `/api/summarize` | Process documents |
| GET | `/api/health` | Health check |
| POST | `/api/wolfram` | Wolfram Alpha queries |

---

## 🔒 Production Deployment

### **Environment Variables (Production):**
```bash
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret-64-chars-minimum
SESSION_SECRET=your-production-session-secret
WOLFRAM_APP_ID=your-wolfram-alpha-app-id
PORT=3000
```

### **Security Checklist:**
- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Unique SESSION_SECRET
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] No default credentials

---

## 📚 Additional Resources

- **Security Audit:** See `SECURITY_AUDIT_REPORT.md`
- **Full Documentation:** See `README.md`
- **Environment Setup:** See `.env.example`

---

## 🆘 Troubleshooting

### **Server won't start:**
```bash
# Check for missing environment variables
node server.js

# Look for security warnings in output
```

### **Login not working:**
```bash
# Default credentials
Username: admin
Password: justice2025

# Check users.json for actual credentials
```

### **Dashboard empty:**
```bash
# Check browser console for errors
# Verify all DOM elements present in index.html
```

---

**Need help?** Open an issue on GitHub or check the security audit report for detailed configuration guidance.

**Ready for production?** Review the security audit checklist and ensure all environment variables are properly configured.
