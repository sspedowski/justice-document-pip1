# Automation Menu Guide (Windows)

This guide details how to run and troubleshoot the project's automation scripts on Windows—whether via the interactive menu (`automation.ps1` / `automation.bat`) or by invoking each tool directly.

---

## 1. Interactive Menu

Use the interactive script to perform any routine maintenance or setup task with a single keystroke.

### PowerShell

1. Open PowerShell in the project root.
2. Run:

   ```powershell
   .\automation.ps1
   ```
3. At the prompt, enter the **number** (1–7) matching your desired task, then press **Enter**.

### Batch

1. Open Command Prompt in the project root.
2. Run:

   ```bat
   automation.bat
   ```
3. Enter your choice (1–7) and press **Enter**.

> **Tip**: Enter only the digit—**do not** append comments or symbols (e.g. `#`).

### Menu Options

| Option | Task                           | Description                                                                                     |
| ------ | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1      | Extract environment variables  | Scans code for hard‑coded keys and generates `.env` + `.env.example`.                           |
| 2      | Clean up & restructure project | Removes backup/shortcut files and moves sources into `/frontend/` and `/backend/`.              |
| 3      | Run linting                    | Executes `npm run lint` across both codebases to catch errors and style issues.                 |
| 4      | Format code                    | Runs `npm run format` (Prettier) to enforce consistent styling.                                 |
| 5      | Update PDF links               | Invokes `python update_pdf_links.py` to fix hyperlinks and add bookmarks in the misconduct PDF. |
| 6      | Install dependencies           | Installs Node modules and Python packages, reports vulnerabilities and pip/pip upgrade notices. |
| 7      | Exit                           | Closes the menu.                                                                                |

---

## 2. Direct Commands (No Menu)

If you prefer to run tasks individually, use the following commands. You can skip the menu altogether.

### Dependencies Installation
```powershell
cd frontend; npm install
cd ..\backend; npm install
pip install -r requirements.txt
```
- After `npm install`, address security via `npm audit fix`
- Python dependencies managed in `requirements.txt`
- Run `python -m pip install --upgrade pip` if prompted

### Environment Variables
```powershell
node extract-env.js
```
Generates `.env`/`.env.example` from hard‑coded secrets.

### Project Cleanup
```bash
bash cleanup-and-structure.sh
```
PowerShell alone doesn't include `bash`—use Git Bash or WSL.

### Code Quality
```powershell
npm run lint    # Check for errors
npm run format  # Apply consistent styling
```
Requires ESLint and Prettier configured per `.eslintrc.js` and `.prettierrc`.

### PDF Processing
```powershell
python update_pdf_links.py
```
Defaults: `old.pdf` → `MCL, Federal Law- Misconduct Analysis (2).pdf`.

---

## 3. Common Pitfalls & Solutions

### Menu input rejected
- **Problem**: Menu won't accept your choice
- **Solution**: Type only the number (e.g., `6`) and press **Enter**
- **Avoid**: Suffixing with comments (`#`) or extra text

### `bash` not found
- **Problem**: Windows doesn't recognize `bash` command
- **Solution**: Install [Git for Windows](https://gitforwindows.org) or enable WSL
- **Alternative**: Use the PowerShell cleanup: `npm run cleanup:windows`

### PDF script errors
- **Problem**: File not found or processing fails
- **Solution**: Check available PDFs first:
  ```powershell
  dir server\uploads\*.pdf
  ```
- **Custom files**:
  ```powershell
  python update_pdf_links.py "path\to\source.pdf" "path\to\target.pdf"
  ```

### No environment variables found
- **Problem**: Script reports no variables extracted
- **Solution**: Confirm config files exist with assignments like:
  ```javascript
  OPENAI_API_KEY = 'your-key-here'
  ```

### Vulnerability warnings
- **Problem**: npm reports security issues
- **Solution**: 
  ```powershell
  npm audit fix          # Auto-fix moderate issues
  npm audit fix --force  # Force fix if needed
  ```

### Python/pip issues
- **Problem**: Python commands fail
- **Solutions**:
  ```powershell
  py update_pdf_links.py           # Try 'py' instead of 'python'
  python -m pip install --upgrade pip  # Upgrade pip when prompted
  ```

---

## 4. Recommended Setup Sequence

On a fresh clone or initial setup, follow these steps in order:

### 1. Install dependencies
```powershell
cd frontend; npm install
cd ..\backend; npm install
pip install PyPDF2
npm audit fix
```

### 2. Clean up & restructure
```bash
# In Git Bash or WSL
bash cleanup-and-structure.sh

# OR in PowerShell
npm run cleanup:windows
```

### 3. Extract environment variables
```powershell
node extract-env.js
```

### 4. Run code quality checks
```powershell
npm run lint
npm run format
```

### 5. Test PDF processing
```powershell
# See available PDFs
dir server\uploads\*.pdf

# Process a test file
python update_pdf_links.py "server\uploads\[your-file].pdf" "Test_Output.pdf"
```

---

## 5. Troubleshooting Your Project Structure

Your project has nested `justice-dashboard` folders. Ensure you're in the correct directory:

```
c:\Users\ssped\justice-dashboard\justice-dashboard\  ← Run scripts from here
```

### Quick verification
```powershell
# Check if you're in the right place
ls *.js     # Should show extract-env.js, check-files.js, etc.
ls *.sh     # Should show cleanup-and-structure.sh
ls *.ps1    # Should show automation.ps1
```

### Working with your PDFs
Your project contains many legal PDFs in `server/uploads/`. Examples:
```powershell
# Court documents
python update_pdf_links.py "server\uploads\1751231212352-2.21.24_Referee_Recommendation_and_Order_RE_Child_Support__1_.pdf" "Updated_Court_Order.pdf"

# Legal responses  
python update_pdf_links.py "server\uploads\1751231212020-2.16.24_Plaintiff_s_Response_and_POS_SUPPORT.pdf" "Updated_Response.pdf"
```

---

Once complete, re-run individual steps as needed. Refer to this guide whenever you need a refresher on which command to run.

Your automation setup is now production-ready for the Justice Dashboard project! 🚀
