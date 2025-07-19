// Justice Dashboard - Secure API and Static File Server
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import session from "express-session";
import multer from "multer";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { fromPath } from "pdf2pic";
import Tesseract from "tesseract.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

dotenv.config();

// Debug flag
const DEBUG = process.env.NODE_ENV !== "production";
if (DEBUG) {
  console.log("Environment Variables:");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not Set");
  console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not Set");
  console.log(
    "SESSION_SECRET:",
    process.env.SESSION_SECRET ? "Set" : "Not Set",
  );
  console.log(
    "WOLFRAM_APP_ID:",
    process.env.WOLFRAM_APP_ID ? "Set" : "Not Set",
  );
}

// Env validation
const requiredEnvVars = ["JWT_SECRET"];
const recommendedEnvVars = ["SESSION_SECRET", "WOLFRAM_APP_ID"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`❌ CRITICAL: Environment variable ${varName} is required`);
  }
});
recommendedEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`⚠️  WARNING: Environment variable ${varName} is not set. Some features may not work.`);
  }
});
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn("⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security.");
}

// Express app
const app = express();
app.set("trust proxy", 1); // Trust Render proxy
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Helmet - strictest CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "style-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'", "http://localhost:3000"],
      },
    },
  })
);
// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:3000",
      "https://sspedowski.github.io",
    ],
    credentials: true,
  })
);
app.use((req, res, next) => {
  console.log("Request origin:", req.headers.origin);
  next();
});

// Rate limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      (() => {
        console.warn("⚠️  WARNING: Using default session secret. Set SESSION_SECRET environment variable for production!");
        return "justice-dashboard-default-secret-" + Date.now();
      })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
// Static files (all options, fallback to /client/dist first)
app.use(express.static(path.join(__dirname, ".")));
app.use(express.static(path.join(__dirname, "justice-dashboard", "frontend")));
app.use(express.static(path.join(__dirname, "public")));
const PUBLIC_DIR = path.join(__dirname, "client", "dist");
app.use(express.static(PUBLIC_DIR));

// Ensure uploads/ exists before multer setup
const UPLOADS_PATH = "uploads";
if (!fs.existsSync(UPLOADS_PATH)) {
  fs.mkdirSync(UPLOADS_PATH, { recursive: true });
}
const upload = multer({ dest: UPLOADS_PATH });

// Default route (for legacy)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ============ User File System ============
const usersPath = path.join(__dirname, "users.json");
function getUsers() {
  if (!fs.existsSync(usersPath)) {
    console.log("Creating initial users file...");
    const hashedPassword = bcrypt.hashSync("justice2025", 10);
    const initialUsers = [
      {
        id: 1,
        username: "admin",
        password: hashedPassword,
        role: "admin",
        fullName: "System Administrator",
        createdAt: new Date().toISOString(),
      },
    ];
    console.log("✅ Initial admin user created with username: admin");
    saveUsers(initialUsers);
    return initialUsers;
  }
  try {
    const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    console.log(`Loaded ${users.length} users from file`);
    return users;
  } catch (error) {
    console.error("Error reading users file:", error);
    if (fs.existsSync(usersPath)) {
      fs.copyFileSync(usersPath, `${usersPath}.backup.${Date.now()}`);
    }
    return [];
  }
}
function saveUsers(users) {
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving users file:", error);
  }
}
async function addUser(username, password, role = "user", fullName = "") {
  if (!username || !password) throw new Error("Username and password are required");
  if (password.length < 8) throw new Error("Password must be at least 8 characters long");
  const users = getUsers();
  const existingUser = users.find((u) => u.username === username);
  if (existingUser) throw new Error("Username already exists");
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Math.max(...users.map((u) => u.id), 0) + 1,
    username,
    password: hashedPassword,
    role,
    fullName,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}
const users = getUsers();

// ============ AUTH MIDDLEWARE ============
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required", code: "TOKEN_MISSING" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token has expired", code: "TOKEN_EXPIRED" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(403).json({ error: "Invalid token", code: "TOKEN_INVALID" });
      } else {
        return res.status(403).json({ error: "Token verification failed", code: "TOKEN_ERROR" });
      }
    }
    req.user = { ...user, tokenVerifiedAt: new Date().toISOString() };
    next();
  });
};

// ============ API ROUTES ============
app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const users = getUsers();
    const user = users.find((u) => u.username === username);
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
      { expiresIn: "24h" },
    );
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    };
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});
app.get("/api/profile", authenticateToken, (req, res) => {
  const users = getUsers();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const profile = {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    passwordChangedAt: user.passwordChangedAt,
  };
  res.json({ success: true, profile: profile });
});
app.post("/api/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }
    const users = getUsers();
    const user = users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    user.passwordChangedAt = new Date().toISOString();
    saveUsers(users);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
app.post(
  "/api/admin/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { username, password, role = "user", fullName = "" } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const newUser = await addUser(username, password, role, fullName);
      const userResponse = { ...newUser };
      delete userResponse.password; // Never send password back
      res.json({
        success: true,
        message: "User created successfully",
        user: userResponse,
      });
    } catch (error) {
      if (error.message === "Username already exists") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
);
app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = getUsers();
    const usersResponse = users.map((user) => {
      const userCopy = { ...user };
      delete userCopy.password;
      return userCopy;
    });
    res.json({ success: true, users: usersResponse });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.delete(
  "/api/admin/users/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const users = getUsers();
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      const updatedUsers = users.filter((user) => user.id !== userId);
      if (updatedUsers.length === users.length) {
        return res.status(404).json({ error: "User not found" });
      }
      saveUsers(updatedUsers);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);
// OCR for scanned PDFs
function ocrPdf(pdfPath) {
  return new Promise((resolve, reject) => {
    fromPath(pdfPath, { density: 200, format: "png", responseType: "image" })(1, { responseType: "image" })
      .then(({ path: pngPath }) =>
        Tesseract.recognize(pngPath, "eng").then(({ data }) => {
          fs.unlink(pngPath, () => {});
          resolve(data.text.trim());
        }),
      )
      .catch(reject);
  });
}
app.post(
  "/api/summarize",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    const pdfPath = req.file.path;
    try {
      const { text } = await pdfParse(fs.readFileSync(pdfPath));
      let plain = text.trim();
      if (!plain) {
        plain = await ocrPdf(pdfPath);
      }
      if (!plain) plain = "[No text found]";
      res.json({
        summary: plain.slice(0, 500),
        fileName: req.file.originalname,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    } finally {
      fs.unlink(pdfPath, () => {});
    }
  },
);
// Health check
app.get("/api/health", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  let authStatus = "unauthenticated";
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      authStatus = "authenticated";
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        authStatus = "token_expired";
      } else {
        authStatus = "invalid_token";
