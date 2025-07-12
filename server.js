const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { fromPath } = require("pdf2pic");
const Tesseract = require("tesseract.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Add debugging statements
const DEBUG = process.env.NODE_ENV !== 'production';
if (DEBUG) {
  console.log('Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not Set');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
  console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Not Set');
  console.log('WOLFRAM_APP_ID:', process.env.WOLFRAM_APP_ID ? 'Set' : 'Not Set');
}

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const recommendedEnvVars = ['SESSION_SECRET', 'WOLFRAM_APP_ID'];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`❌ CRITICAL: Environment variable ${varName} is required`);
  }
});

recommendedEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`⚠️  WARNING: Environment variable ${varName} is not set. Some features may not work.`);
  }
});

// Additional security validation
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security.');
}

// Initialize Express app
const app = express();
app.set('trust proxy', 1); // Trust Render's reverse proxy for rate limiting

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Security middleware - Strictest CSP for maximum security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"], // No unsafe-inline needed!
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'none'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  }
}));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000", 
    "https://sspedowski.github.io"
  ],
  credentials: true
}));

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
// Note: Using MemoryStore for sessions - acceptable for demo/testing
// For production scale, consider: connect-mongo, connect-redis, or express-session-file-store
app.use(session({
  secret: process.env.SESSION_SECRET || (() => {
    console.warn('⚠️  WARNING: Using default session secret. Set SESSION_SECRET environment variable for production!');
    return "justice-dashboard-default-secret-" + Date.now();
  })(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static(path.join(__dirname, ".")));
app.use(express.static(path.join(__dirname, "justice-dashboard", "frontend")));
app.use(express.static(path.join(__dirname, "public")));

// Default route - serve main dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// File-based user storage for security
const usersPath = path.join(__dirname, 'users.json');

// Load users from file
function getUsers() {
  if (!fs.existsSync(usersPath)) {
    console.log('Creating initial users file...');
    // Create initial users file if it doesn't exist
    const hashedPassword = bcrypt.hashSync("justice2025", 10);
    
    const initialUsers = [
      {
        id: 1,
        username: "admin",
        password: hashedPassword,
        role: "admin",
        fullName: "System Administrator",
        createdAt: new Date().toISOString()
      }
    ];
    console.log('✅ Initial admin user created with username: admin');
    saveUsers(initialUsers);
    return initialUsers;
  }
  try {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    console.log(`Loaded ${users.length} users from file`);
    return users;
  } catch (error) {
    console.error('Error reading users file:', error);
    // Create backup of corrupted file
    if (fs.existsSync(usersPath)) {
      fs.copyFileSync(usersPath, `${usersPath}.backup.${Date.now()}`);
    }
    // Return empty array to prevent crashes
    return [];
  }
}

// Save users to file
function saveUsers(users) {
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users file:', error);
  }
}

// Add user function (for admin use)
async function addUser(username, password, role = 'user', fullName = '') {
  // Input validation
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  const users = getUsers();
  const existingUser = users.find(u => u.username === username);
  
  if (existingUser) {
    throw new Error('Username already exists');
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Math.max(...users.map(u => u.id), 0) + 1,
    username,
    password: hashedPassword,
    role,
    fullName,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

// Initialize users (load from file)
const users = getUsers();

// Enhanced authentication middleware with better error handling
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      error: "Access token required",
      code: "TOKEN_MISSING"
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log(`Token verification failed: ${err.message}`);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: "Token has expired",
          code: "TOKEN_EXPIRED"
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          error: "Invalid token",
          code: "TOKEN_INVALID"
        });
      } else {
        return res.status(403).json({ 
          error: "Token verification failed",
          code: "TOKEN_ERROR"
        });
      }
    }
    
    // Add timestamp of token verification
    req.user = { ...user, tokenVerifiedAt: new Date().toISOString() };
    next();
  });
};

// Token refresh endpoint
app.post("/api/refresh-token", authenticateToken, (req, res) => {
  try {
    // Generate a new token with extended expiry
    const newToken = jwt.sign(
      { 
        id: req.user.id, 
        username: req.user.username, 
        role: req.user.role 
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`✅ Token refreshed for user: ${req.user.username}`);

    res.json({
      success: true,
      token: newToken,
      expiresIn: "24h"
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

// Password change endpoint
app.post("/api/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: "Current password and new password required" 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: "New password must be at least 8 characters long" 
      });
    }

    const users = getUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      console.log(`Password change failed - Invalid current password for user: ${user.username}`);
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    user.password = hashedNewPassword;
    user.passwordChangedAt = new Date().toISOString();
    
    saveUsers(users);
    
    console.log(`✅ Password changed successfully for user: ${user.username}`);

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============= API ROUTES =============

app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      console.log('Login attempt failed: Missing credentials');
      return res.status(400).json({ error: "Username and password required" });
    }

    // Log login attempt (without password for security)
    console.log(`Login attempt for username: ${username}`);

    const users = getUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      console.log(`Login failed - User not found: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log(`Login failed - Invalid password for user: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set session data
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    };

    // Update last login time
    user.lastLogin = new Date().toISOString();
    saveUsers(users);

    console.log(`✅ Login successful for user: ${username} (${user.role})`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// User session monitoring endpoint
app.get("/api/user-sessions", authenticateToken, (req, res) => {
  try {
    // Only allow admin users to view sessions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = getUsers();
    const sessionInfo = users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      lastLogin: user.lastLogin || null,
      passwordChangedAt: user.passwordChangedAt || null,
      createdAt: user.createdAt || null
    }));

    res.json({
      success: true,
      sessions: sessionInfo
    });
  } catch (error) {
    console.error("Session monitoring error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User profile endpoint
app.get("/api/profile", authenticateToken, (req, res) => {
  try {
    const users = getUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user profile without sensitive data
    const profile = {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      passwordChangedAt: user.passwordChangedAt
    };

    res.json({
      success: true,
      profile: profile
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Admin: Add new user
app.post("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role = 'user', fullName = '' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    
    const newUser = await addUser(username, password, role, fullName);
    const userResponse = { ...newUser };
    delete userResponse.password; // Never send password back
    
    res.json({
      success: true,
      message: "User created successfully",
      user: userResponse
    });
  } catch (error) {
    console.error("Add user error:", error);
    if (error.message === 'Username already exists') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: List all users
app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = getUsers();
    const usersResponse = users.map(user => {
      const userCopy = { ...user };
      delete userCopy.password; // Never send passwords
      return userCopy;
    });
    
    res.json({
      success: true,
      users: usersResponse
    });
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: Delete user
app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = getUsers();
    
    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    
    const updatedUsers = users.filter(user => user.id !== userId);
    
    if (updatedUsers.length === users.length) {
      return res.status(404).json({ error: "User not found" });
    }
    
    saveUsers(updatedUsers);
    
    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// File upload configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) =>
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files allowed"))
});

// OCR function
function ocrPdf(pdfPath) {
  return new Promise((resolve, reject) => {
    fromPath(pdfPath, { density: 200, format: "png", responseType: "image" })
      (1, { responseType: "image" })
      .then(({ path: pngPath }) =>
        Tesseract.recognize(pngPath, "eng")
          .then(({ data }) => {
            fs.unlink(pngPath, () => {}); // cleanup PNG
            resolve(data.text.trim());
          })
      )
      .catch(reject);
  });
}

// PDF summarize endpoint
app.post("/api/summarize", authenticateToken, upload.single("file"), async (req, res) => {
  const pdfPath = req.file.path;
  try {
    const { text } = await pdfParse(fs.readFileSync(pdfPath));
    let plain = text.trim();

    if (!plain) {
      console.log(`[OCR] ${req.file.originalname}`);
      plain = await ocrPdf(pdfPath);
    }
    if (!plain) plain = "[No text found]";

    res.json({
      summary: plain.slice(0, 500),
      fileName: req.file.originalname
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlink(pdfPath, () => {}); // cleanup upload
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  let authStatus = "unauthenticated";
  
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      authStatus = "authenticated";
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        authStatus = "token_expired";
      } else {
        authStatus = "invalid_token";
      }
    }
  }

  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    authentication: authStatus,
    version: "1.0.0"
  });
});

// Error handling endpoint
app.post("/api/report-error", (req, res) => {
  console.error("Client error:", req.body);
  res.json({ success: true, message: "Error reported" });
});

// Wolfram API endpoint
app.post("/api/wolfram", authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: "Query parameter required" });
    }

    const WOLFRAM_APP_ID = process.env.WOLFRAM_APP_ID;
    if (!WOLFRAM_APP_ID) {
      return res.status(500).json({ error: "Wolfram API not configured" });
    }

    const wolframUrl = `https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(query)}&format=plaintext&output=JSON&appid=${WOLFRAM_APP_ID}`;
    
    const response = await fetch(wolframUrl);
    const data = await response.json();
    
    if (data.queryresult && data.queryresult.success) {
      res.json({
        success: true,
        result: data.queryresult
      });
    } else {
      res.status(400).json({ 
        error: "No results found",
        details: data.queryresult?.error || "Unknown error"
      });
    }
  } catch (error) {
    console.error("Wolfram API error:", error);
    res.status(500).json({ error: "Wolfram API request failed" });
  }
});

// ============= FRONTEND ROUTES =============

// Serve frontend - DISABLED: Use secure-dashboard.html as default
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "index.html"));
// });

// Start server
app.listen(PORT, () => {
  console.log(`✅ Justice Dashboard API running on http://localhost:${PORT}`);
  console.log(`📋 API endpoints available:`);
  console.log(`   POST /api/login`);
  console.log(`   POST /api/logout`);
  console.log(`   GET  /api/profile`);
  console.log(`   POST /api/summarize`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/report-error`);
  console.log(`   POST /api/wolfram`);
});
