# Justice Dashboard Automation Scripts

This directory contains automation scripts to help maintain and structure the Justice Dashboard project.

## Available Scripts

### 1. Project Cleanup and Restructuring (`cleanup-and-structure.sh`)

**Purpose**: Removes Windows shortcuts/backups and restructures the project into a clean frontend/backend architecture.

**Usage**:
```bash
# Make script executable (Git Bash/WSL)
chmod +x cleanup-and-structure.sh

# Run the script
./cleanup-and-structure.sh
```

**What it does**:
- Removes `*.lnk` files and backup scripts
- Creates `frontend/` and `backend/` directories
- Moves client files to `frontend/`
- Moves server files to `backend/`
- Organizes documentation in proper directories

### 2. Environment Variable Extraction (`extract-env.js`)

**Purpose**: Scans configuration files for hard-coded credentials and creates `.env` files.

**Usage**:
```bash
# Run with npm script
npm run extract-env

# Or run directly
node extract-env.js
```

**What it does**:
- Scans `frontend/`, `backend/`, `client/`, and `server/` for configuration files
- Extracts API keys, database passwords, and Firebase config
- Creates `.env` file with found variables
- Creates `.env.example` with placeholder values
- Adds `.env` to `.gitignore` if not present

### 3. Code Quality Tools

**ESLint Configuration** (`.eslintrc.js`):
- Configured for React and Node.js environments
- Extends recommended rules and Prettier integration
- Custom rules for unused variables and console statements

**Prettier Configuration** (`.prettierrc`):
- Consistent code formatting
- Single quotes, trailing commas, 80-character line width

**Available Commands**:
```bash
# Lint code
npm run lint

# Fix lint issues automatically
npm run lint:fix

# Format code
npm run format

# Check if code is formatted
npm run format:check
```

### 4. GitHub Actions CI/CD (`.github/workflows/ci.yml`)

**Purpose**: Automated testing and building on pull requests and main branch pushes.

**Features**:
- Node.js 18 environment
- Dependency installation for frontend and backend
- Linting and formatting checks
- Test execution
- Build validation

### 5. PDF Processing (`update_pdf_links.py`)

**Purpose**: Updates hyperlinks and adds bookmarks to legal PDF documents.

**Usage**:
```bash
# Install Python dependencies (if needed)
pip install PyPDF2

# Run with npm script
npm run update-pdf "input.pdf" "output.pdf"

# Or run directly
python update_pdf_links.py input.pdf "MCL, Federal Law- Misconduct Analysis (2).pdf"
```

**What it does**:
- Updates PDF hyperlinks
- Adds structured bookmarks for legal documents
- Processes annotations safely
- Creates organized document structure

## Installation and Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Extract environment variables**:
   ```bash
   npm run extract-env
   ```

3. **Set up your `.env` file** with actual values:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and configuration
   ```

4. **Run code quality checks**:
   ```bash
   npm run lint
   npm run format
   ```

## Project Structure After Cleanup

```
justice-dashboard/
├── frontend/               # Client-side application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/                # Server-side application
│   ├── server.js
│   ├── uploads/
│   └── package.json
├── docs/                   # Documentation
├── scripts/                # Automation scripts
├── config/                 # Configuration files
├── .env                    # Environment variables (not in git)
├── .env.example           # Environment template
├── .eslintrc.js           # ESLint configuration
├── .prettierrc            # Prettier configuration
└── .github/workflows/     # CI/CD workflows
```

## Environment Variables

The following environment variables are supported:

### Authentication
- `DASH_USER` - Dashboard username
- `DASH_PASS` - Dashboard password

### APIs
- `OPENAI_API_KEY` - OpenAI API key for AI features

### Firebase (Frontend)
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

### Server Configuration
- `VITE_API_URL` - Backend API URL (default: http://localhost:4000)

## Contributing

1. Run the cleanup script to ensure proper project structure
2. Extract environment variables and configure your `.env`
3. Run linting and formatting before committing:
   ```bash
   npm run lint:fix
   npm run format
   ```
4. All commits will be checked by GitHub Actions CI

## Troubleshooting

### Windows Users
- Use Git Bash or WSL to run bash scripts
- Ensure Python is installed for PDF processing
- Use PowerShell as an alternative:
  ```powershell
  # Instead of bash script, manually create directories:
  mkdir frontend, backend
  # Then move files as needed
  ```

### Missing Dependencies
- Run `npm install` to install Node.js dependencies
- Run `pip install PyPDF2` for PDF processing
- Install Git Bash for script execution on Windows

### Permission Issues
- Make scripts executable: `chmod +x *.sh`
- Run as administrator if needed on Windows
- Check file permissions in the project directory
