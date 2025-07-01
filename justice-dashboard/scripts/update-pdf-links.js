#!/usr/bin/env node

/**
 * PDF Link Updater - JavaScript Version
 * Updates PDF links and bookmarks for Justice Dashboard
 *
 * Usage:
 *   node scripts/update-pdf-links.js <input.pdf> [output.pdf]
 *   npm run update-pdf-links <input.pdf> [output.pdf]
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const DEFAULT_OUTPUT = 'MCL, Federal Law- Misconduct Analysis (2).pdf';
const COMMON_PDF_LOCATIONS = ['server/uploads', 'uploads', '.'];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findPDFFiles() {
  const foundPdfs = [];

  for (const location of COMMON_PDF_LOCATIONS) {
    if (fs.existsSync(location)) {
      try {
        const files = fs.readdirSync(location);
        const pdfFiles = files.filter(file =>
          file.toLowerCase().endsWith('.pdf')
        );

        for (const file of pdfFiles) {
          const fullPath = path.join(location, file);
          const stats = fs.statSync(fullPath);
          foundPdfs.push({
            path: fullPath,
            name: file,
            size: Math.round(stats.size / 1024), // Size in KB
          });
        }
      } catch (error) {
        // Ignore permission errors
      }
    }
  }

  return foundPdfs;
}

function displayPDFFiles(pdfs) {
  if (pdfs.length === 0) {
    log('\n[ERROR] No PDF files found in common locations:', 'red');
    log('Expected locations:', 'yellow');
    log('   • server/uploads/', 'gray');
    log('   • uploads/', 'gray');
    log('   • current directory (.)', 'gray');
    log('\nTroubleshooting steps:', 'yellow');
    log('1. Check if PDFs exist in any of the above folders', 'gray');
    log('2. Ensure you have read permissions for these locations', 'gray');
    log('3. Try providing the full absolute path to your PDF file:', 'gray');
    log('   Example: C:\\Users\\ssped\\Documents\\input.pdf', 'gray');
    log('\nUsage:', 'yellow');
    log('  node scripts/update-pdf-links.js <input.pdf> [output.pdf]', 'gray');
    return;
  }

  log(`\n[FOUND] ${pdfs.length} PDF file(s):`, 'green');
  for (let i = 0; i < Math.min(pdfs.length, 10); i++) {
    const pdf = pdfs[i];
    log(`   ${i + 1}. ${pdf.path} (${pdf.size}KB)`, 'cyan');
  }

  if (pdfs.length > 10) {
    log(`   ... and ${pdfs.length - 10} more files`, 'gray');
  }

  log(
    '\nTIP: Copy and paste one of the paths above, or provide a custom path.',
    'yellow'
  );
}

function validateInputFile(inputPath) {
  if (!inputPath) {
    log('[ERROR] Input file path is required.', 'red');
    return false;
  }

  if (!fs.existsSync(inputPath)) {
    log(`[ERROR] Input file not found: ${inputPath}`, 'red');
    log('Please check the file path and try again.', 'gray');
    return false;
  }

  if (!inputPath.toLowerCase().endsWith('.pdf')) {
    log('[WARNING] Input file does not have a .pdf extension.', 'yellow');
  }

  return true;
}

function runPythonScript(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', 'update_pdf_links.py');

    // Check if Python script exists
    if (!fs.existsSync(pythonScript)) {
      log(`[ERROR] Python script not found: ${pythonScript}`, 'red');
      log(
        'Please ensure update_pdf_links.py exists in the project root.',
        'gray'
      );
      reject(new Error('Python script not found'));
      return;
    }

    log('\nProcessing PDF...', 'green');
    log(`Input:  ${inputPath}`, 'gray');
    log(`Output: ${outputPath}`, 'gray');
    log('');

    const python = spawn('python', [pythonScript, inputPath, outputPath], {
      stdio: 'inherit',
    });

    python.on('close', code => {
      if (code === 0) {
        log('\n[SUCCESS] PDF processing completed successfully!', 'green');
        log(`Output saved as: ${outputPath}`, 'cyan');

        // Show file info if it exists
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          const fileSizeKB = Math.round(stats.size / 1024);
          log(`File size: ${fileSizeKB} KB`, 'gray');
        }
        resolve();
      } else {
        log('\n[ERROR] PDF processing failed!', 'red');
        log('Check that:', 'yellow');
        log('   • Input file path is correct', 'gray');
        log('   • Python and PyPDF2 are installed', 'gray');
        log('   • You have write permissions for the output location', 'gray');
        reject(new Error(`Python script exited with code ${code}`));
      }
    });

    python.on('error', error => {
      log('\n[ERROR] Failed to start Python process:', 'red');
      log(error.message, 'gray');
      log('\nEnsure Python is installed and available in your PATH.', 'yellow');
      reject(error);
    });
  });
}

async function main() {
  log('PDF Link Updater - JavaScript Version', 'cyan');
  log('====================================', 'cyan');

  const args = process.argv.slice(2);
  let inputPath = args[0];
  let outputPath = args[1] || DEFAULT_OUTPUT;

  // If no input provided, show available PDFs and exit
  if (!inputPath) {
    log('\nScanning for PDF files in common locations...', 'yellow');
    const pdfs = findPDFFiles();
    displayPDFFiles(pdfs);

    log('\nUsage:', 'yellow');
    log('  node scripts/update-pdf-links.js <input.pdf> [output.pdf]', 'gray');
    log('  npm run update-pdf-links <input.pdf> [output.pdf]', 'gray');
    log('\nExample:', 'yellow');
    log(
      '  node scripts/update-pdf-links.js "server/uploads/document.pdf"',
      'gray'
    );
    log(
      '  npm run update-pdf-links "C:/Documents/legal.pdf" "Updated_Legal.pdf"',
      'gray'
    );

    process.exit(1);
  }

  // Validate input file
  if (!validateInputFile(inputPath)) {
    process.exit(1);
  }

  // Show current configuration
  log('\nConfiguration:', 'blue');
  log(`  Input:  ${inputPath}`, 'gray');
  log(`  Output: ${outputPath}`, 'gray');

  try {
    await runPythonScript(inputPath, outputPath);
    log('\n✓ PDF link update process completed!', 'green');
  } catch (error) {
    log('\n✗ PDF link update process failed!', 'red');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
  log('\n[ERROR] Unhandled promise rejection:', 'red');
  log(error.message, 'gray');
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  log('\n\nOperation cancelled by user.', 'yellow');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    log('\n[ERROR] Script execution failed:', 'red');
    log(error.message, 'gray');
    process.exit(1);
  });
}

module.exports = {
  findPDFFiles,
  validateInputFile,
  runPythonScript,
  DEFAULT_OUTPUT,
  COMMON_PDF_LOCATIONS,
};
