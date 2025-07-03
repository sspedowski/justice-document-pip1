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
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-this";

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
app.use(express.static(path.join(__dirname, "client")));
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
    // Create initial users file if it doesn't exist
    const initialUsers = [
      {
        id: 1,
        username: "admin",
        password: bcrypt.hashSync("justice2025", 10),
        role: "admin",
        fullName: "System Administrator",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        username: "stephanie",
        password: bcrypt.hashSync("spedowski2024", 10),
        role: "user",
        fullName: "Stephanie Spedowski",
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        username: "legal",
        password: bcrypt.hashSync("legal123", 10),
        role: "user",
        fullName: "Legal Team",
        createdAt: new Date().toISOString()
      }
    ];
    saveUsers(initialUsers);
    return initialUsers;
  }
  try {
    return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch (error) {
    console.error('Error reading users file:', error);
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

// Login endpoint
app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const users = getUsers(); // Get fresh users from file
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
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

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

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
