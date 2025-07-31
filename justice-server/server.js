// ==========================
// Justice Dashboard Server
// Render Production Build
// ==========================
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { fromPath } = require("pdf2pic");
const Tesseract = require("tesseract.js");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const chalk = require("chalk");
// ==========================
// Load Environment Variables
// ==========================
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(process.cwd(), 'justice-server', '.env'),
  path.join(__dirname, '..', 'justice-server', '.env')
];
let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    console.log(chalk.cyan(`📄 Loaded environment from: ${envPath}`));
    envLoaded = true;
    break;
  }
}
if (!envLoaded) {
  console.warn(chalk.yellow('⚠️  No .env file found. Using Render environment variables...'));
}
// ... [rest of the provided code] ...
