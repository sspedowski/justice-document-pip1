# Automation Menu Guide (Windows)

This guide explains how to run the automation scripts on Windows, both via the interactive menu (`automation.ps1` / `automation.bat`) and direct command lines.

---

## 1. Interactive Menu

**PowerShell**

1. Open PowerShell in the project root.
2. Run:

   ```powershell
   .\automation.ps1
   ```

3. At the prompt, enter a number 1–7 (no extra characters or comments).
   - **Example**: To extract env vars, type `1` and press **Enter**.

**Batch**

1. Open Command Prompt in the project root.
2. Run:

   ```bat
   automation.bat
   ```

3. Enter your choice (1–7) and press **Enter**.

> **Tip**: Do **not** include trailing `#` or comments when typing your selection.

---

## 2. Direct Commands (no menu)

You can skip the menu and invoke each script directly.

| Task                 | Command                                          | Notes              |
| -------------------- | ------------------------------------------------ | ------------------ |
| Install dependencies | `npm install` in both `frontend/` and `backend/` | Run separately or: |

```powershell
cd frontend; npm install; cd ..\backend; npm install
```

| Extract environment variables | `node extract-env.js` | Scans for hard‑coded keys and creates `.env` |
| Clean up & restructure | Run in Git Bash (or WSL): `bash cleanup-and-structure.sh` | Windows PowerShell does not include `bash` by default. |
| Run linting | `npm run lint` | Requires ESLint configured |
| Format code | `npm run format` | Requires Prettier configured |
| Update PDF links | `python update_pdf_links.py` | Default input is `old.pdf`; output is `MCL, Federal Law- Misconduct Analysis (2).pdf` |
| Exit | N/A | Simply close the terminal window |

---

## 3. Common Pitfalls & Solutions

- **Menu won't accept choice**  
  • Make sure you enter only a digit `1–7`, then press **Enter**.  
  • Do **not** suffix with `#` or text.

- **`bash` not recognized**  
  • Either install Git Bash (https://gitforwindows.org) or use WSL.  
  • Then open the Git Bash terminal and run `bash cleanup-and-structure.sh`.

- **`python update_pdf_links.py input.pdf output.pdf` fails**  
  • The script defaults to:
  - **Input**: `old.pdf` in the project root.
  - **Output**: `MCL, Federal Law- Misconduct Analysis (2).pdf`.  
    • To specify custom names, run:

  ```powershell
  python update_pdf_links.py path\to\your-old.pdf "path\to\MCL, Federal Law- Misconduct Analysis (2).pdf"
  ```

- **No environment variables found**  
  • Ensure your configuration files (e.g., `frontend/src/config.js`, `backend/config.js`) exist and contain assignments like `OPENAI_API_KEY = '...'`.

---

## 4. Recommended Setup Sequence

1. **Install dependencies**:

   ```powershell
   cd frontend; npm install
   cd ..\backend; npm install
   ```

2. **Clean up & restructure** (in Git Bash or WSL):

   ```bash
   bash cleanup-and-structure.sh
   ```

3. **Extract environment variables**:

   ```powershell
   node extract-env.js
   ```

4. **Run linting**:

   ```powershell
   npm run lint
   ```

5. **Format code**:

   ```powershell
   npm run format
   ```

6. **Update PDF links**:
   ```powershell
   python update_pdf_links.py
   ```

After this initial setup, you can re-run any individual step as needed. Refer to this guide whenever you're unsure which command to run.

## 5. Troubleshooting File Paths

Since your project structure has nested `justice-dashboard` folders, make sure you're running commands from the correct directory:

```
c:\Users\ssped\justice-dashboard\justice-dashboard\  ← Run scripts from here
```

**Quick verification**:

```powershell
# Check if you're in the right directory
ls *.js  # Should show extract-env.js, check-files.js, etc.
ls *.sh  # Should show cleanup-and-structure.sh
```

## 6. Working with Existing PDFs

Your project has many PDFs in `server/uploads/`. To process one of them:

```powershell
# Example: Update links in an existing legal document
python update_pdf_links.py "server\uploads\1751231212352-2.21.24_Referee_Recommendation_and_Order_RE_Child_Support__1_.pdf" "Updated_Court_Order.pdf"
```
