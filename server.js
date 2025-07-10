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

const app = express();
const PORT = process.env.PORT || 3000;

// Security: JWT Secret must be provided via environment variable
// Security: JWT Secret must be provided via environment variable
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL ERROR: JWT_SECRET environment variable not set or too weak');
  console.error('Please set JWT_SECRET in your .env file with at least 32 characters');
  process.exit(1);
}
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
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
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
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret",
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

// Default route - serve secure dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'secure-dashboard.html'));
});

// File-based user storage for security
const usersPath = path.join(__dirname, 'users.json');

// Load users from file
function getUsers() {
  if (!fs.existsSync(usersPath)) {
    console.log('🔍 DEBUGGING - Creating initial users file...');
    // Create initial users file if it doesn't exist
    const hashedPassword = bcrypt.hashSync("justice2025", 10);
    console.log('🔍 DEBUGGING - Created hash for justice2025:', hashedPassword);
    console.log('🔍 DEBUGGING - Hash verification test:', bcrypt.compareSync("justice2025", hashedPassword));
    
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
    console.log('🔍 DEBUGGING - Initial users to save:', JSON.stringify(initialUsers, null, 2));
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// ============= API ROUTES =============

app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation with detailed logging
    if (!username || !password) {
      console.log('Login attempt failed: Missing credentials');
      console.log('Username provided:', !!username);
      console.log('Password provided:', !!password);
      return res.status(400).json({ error: "Username and password required" });
    }
    // Debug log
    console.log('🔍 DEBUGGING - Login attempt for username:', username);
    console.log('🔍 DEBUGGING - Password provided:', password);

    // Test bcrypt functionality
    const testHash = await bcrypt.hash('justice2025', 10);
    console.log('🔍 DEBUGGING - Test hash created:', testHash);
    console.log('🔍 DEBUGGING - Test hash matches justice2025:', await bcrypt.compare('justice2025', testHash));

    const users = getUsers(); // Get fresh users from file
    console.log('🔍 DEBUGGING - Number of users loaded:', users.length);
    console.log('🔍 DEBUGGING - Users data:', JSON.stringify(users, null, 2));
    
    const user = users.find(u => u.username === username);
    console.log('🔍 DEBUGGING - User found:', !!user);
    if (user) {
      console.log('🔍 DEBUGGING - User details:', JSON.stringify(user, null, 2));
      console.log('🔍 DEBUGGING - Stored password hash:', user.password);
    }
    
    if (!user) {
      console.log('🔍 DEBUGGING - No user found with username:', username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log('🔍 DEBUGGING - Comparing password...');
    console.log('🔍 DEBUGGING - Input password:', password);
    console.log('🔍 DEBUGGING - Stored hash:', user.password);
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔍 DEBUGGING - Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('🔍 DEBUGGING - Password validation failed');
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    };

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

// Profile endpoint
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
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
  res.json({ status: "OK", timestamp: new Date().toISOString() });
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

    const wolframUrl = `http://api.wolframalpha.com/v2/query?input=${encodeURIComponent(query)}&format=plaintext&output=JSON&appid=${WOLFRAM_APP_ID}`;
    
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
