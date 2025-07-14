# 🚀 Justice Dashboard - Render Deployment Guide

## 🎯 **Quick Deploy to Render**

### **Step 1: Prepare Repository**
1. **Push your code to GitHub** (if not already done)
2. **Ensure all files are committed** including the new guest login functionality

### **Step 2: Create Render Service**
1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub** and select your `justice-dashboard` repository
4. **Configure the service:**
   - **Name:** `justice-dashboard`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node Version:** `22` (or latest)

### **Step 3: Configure Environment Variables**
In Render dashboard → **Environment** tab, add these variables:

```bash
# Essential Variables
NODE_ENV=production
PORT=10000
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long_random_string
SESSION_SECRET=another_super_secure_session_secret_32_chars_minimum

# API Keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOLFRAM_APP_ID=V4LLLJ-9T4HVKL4H9

# Database (optional for local file-based auth)
MONGODB_URI=mongodb+srv://your_mongodb_connection_string

# Admin Credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_admin_password_2025
```

## 🔐 **Guest Login Credentials**

Your Justice Dashboard now includes a **Guest Login** feature perfect for Render deployment!

### **How Users Access the System:**

#### **🎯 Option 1: Guest Login (Recommended for Public Access)**
- **URL:** `https://your-app-name.onrender.com`
- **Method:** Click **"Continue as Guest"** button
- **Access Level:** Standard user permissions
- **No credentials needed!**

#### **🔑 Option 2: Admin Login**
- **Username:** `admin`
- **Password:** `[Set ADMIN_PASSWORD in Render environment]`
- **Access Level:** Full administrative access

#### **🔑 Option 3: Direct Guest Credentials**
- **Username:** `guest`
- **Password:** `guest123`
- **Access Level:** Standard user permissions

## 🎨 **User Experience Features**

### **Login Page Features:**
✅ **Beautiful, modern UI** with Tailwind CSS  
✅ **One-click guest access** - no registration needed  
✅ **Server status indicator** - shows connection health  
✅ **Responsive design** - works on mobile and desktop  
✅ **Enhanced security** - JWT tokens, rate limiting  

### **Dashboard Features:**
✅ **Wolfram Alpha Integration** - AI-powered legal research  
✅ **Secure file processing** - Upload and analyze documents  
✅ **Modern table interface** - Organized case management  
✅ **Dark mode support** - Eye-friendly interface  
✅ **Session management** - Automatic token refresh  

## 🔧 **Render-Specific Configuration**

### **Step 4: Update server.js for Render**
The server is already configured for Render with:
- ✅ **Dynamic PORT** from environment variables
- ✅ **Production optimizations** 
- ✅ **CORS configuration** for cross-origin requests
- ✅ **Helmet security** with proper CSP headers

### **Step 5: Deploy!**
1. **Click "Create Web Service"** in Render
2. **Wait for deployment** (usually 2-5 minutes)
3. **Get your live URL:** `https://your-app-name.onrender.com`

## 🧪 **Testing Your Deployment**

### **Immediate Tests:**
1. **Visit your Render URL**
2. **Click "Continue as Guest"** 
3. **Verify dashboard loads**
4. **Test Wolfram Alpha** with query: "What is 2+2?"
5. **Upload a test file**

### **Expected Results:**
- ✅ **Login page loads** with guest button
- ✅ **Guest login works** instantly
- ✅ **Dashboard displays** with all features
- ✅ **Wolfram queries** return results
- ✅ **File uploads** process correctly

## 🌟 **Perfect for Public Demos**

This setup is **ideal for showcasing** your Justice Dashboard:

### **🎯 For Potential Clients:**
- **No account creation required**
- **Instant access** via guest login
- **Full feature demonstration**
- **Professional appearance**

### **🎯 For Presentations:**
- **Reliable cloud hosting**
- **Fast loading times**
- **Mobile-friendly interface**
- **Always available**

## 🔒 **Security Notes**

### **Production Security Checklist:**
- ✅ **Change default passwords** in environment variables
- ✅ **Generate strong JWT_SECRET** (32+ characters)
- ✅ **Add SESSION_SECRET** for enhanced security  
- ✅ **Monitor logs** in Render dashboard
- ✅ **Enable HTTPS** (automatic with Render)

### **Guest Account Limitations:**
- ✅ **Read-only for sensitive data**
- ✅ **Standard user permissions** only
- ✅ **No admin functions** accessible
- ✅ **Session expires** automatically

## 🚀 **Next Steps After Deployment**

1. **Share your live URL:** `https://your-app-name.onrender.com`
2. **Test all features** thoroughly
3. **Monitor performance** in Render dashboard
4. **Set up custom domain** (optional)
5. **Configure SSL certificate** (automatic)

## 📞 **Support & Troubleshooting**

### **Common Issues:**
- **Build fails:** Check Node.js version in Render settings
- **Environment variables:** Verify all required vars are set
- **Login issues:** Check JWT_SECRET is properly configured
- **API errors:** Verify OPENAI_API_KEY and WOLFRAM_APP_ID

### **Render Logs:**
Access real-time logs in your Render dashboard to debug any issues.

---

## 🎉 **Your Justice Dashboard is Now Live!**

**Features Available:**
- ✅ **Guest Login** - One-click access
- ✅ **Wolfram Alpha** - AI legal research  
- ✅ **Document Processing** - File analysis
- ✅ **Secure Authentication** - JWT tokens
- ✅ **Modern UI** - Professional appearance
- ✅ **Cloud Hosting** - 99.9% uptime

**Perfect for:** Demonstrations, client showcases, public access, legal research, document analysis

Your Justice Dashboard is now ready for production use! 🚀
