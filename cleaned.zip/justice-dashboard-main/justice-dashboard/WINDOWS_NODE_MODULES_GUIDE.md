# Windows/PowerShell Guide: Cleaning & Reinstalling Node Modules

If you see errors like `rm: parameter cannot be found` or `&& is not a valid statement separator`, you are using Linux/macOS commands in Windows PowerShell. Here's how to do the same tasks the Windows way for your Justice Dashboard project.

---

## 1. **How to Remove node_modules and package-lock.json on Windows**

Instead of:

```bash
rm -rf node_modules package-lock.json
```

Use this PowerShell command:

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
```

For subfolders (like backend/):

```powershell
Remove-Item -Recurse -Force backend/node_modules, backend/package-lock.json
```

---

## 2. **How to Run Multiple Commands in PowerShell**

Instead of using `&&` (Linux/Unix):

```bash
cd backend && npm install
```

You can do this in PowerShell with a semicolon `;` or just run lines separately:

```powershell
cd backend; npm install
```

Or one after the other:

```powershell
cd backend
npm install
```

---

## 3. **Quick Copy/Paste Reference**

**To clean and reinstall for your main project folder:**

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

**To do the same in the backend folder:**

```powershell
Remove-Item -Recurse -Force backend/node_modules, backend/package-lock.json
cd backend
npm install
```

---

## 4. **Common PowerShell vs Bash Commands**

| Task                 | Bash/Linux       | PowerShell                           |
| -------------------- | ---------------- | ------------------------------------ |
| Remove files         | `rm -rf folder`  | `Remove-Item -Recurse -Force folder` |
| Chain commands       | `cmd1 && cmd2`   | `cmd1; cmd2`                         |
| List files           | `ls -la`         | `Get-ChildItem -Force` or `dir`      |
| Copy files           | `cp -r src dest` | `Copy-Item -Recurse src dest`        |
| Move files           | `mv src dest`    | `Move-Item src dest`                 |
| Check if file exists | `[ -f file ]`    | `Test-Path file`                     |

---

## 5. **Notes for npm Audit Warnings**

- The npm audit warnings you see are mostly due to dependencies of Firebase and related packages. You've already done all you can with `npm audit fix`.
- These warnings are _moderate_ severity. If your app is not public-facing, you can safely ignore them for now. Continue monitoring for updates to Firebase and dependencies.

---

## 6. **Justice Dashboard Specific Commands**

**Clean everything and reinstall:**

```powershell
# Main project
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install

# Backend (if it has its own package.json)
if (Test-Path "backend/package.json") {
    Remove-Item -Recurse -Force backend/node_modules, backend/package-lock.json -ErrorAction SilentlyContinue
    cd backend
    npm install
    cd ..
}

# Frontend (if it has its own package.json)
if (Test-Path "frontend/package.json") {
    Remove-Item -Recurse -Force frontend/node_modules, frontend/package-lock.json -ErrorAction SilentlyContinue
    cd frontend
    npm install
    cd ..
}
```

**Run your automation menu:**

```powershell
.\automation.ps1
```

**Test PDF processing:**

```powershell
npm run update-pdf-links "path\to\your\file.pdf"
```

---

## 7. **Troubleshooting Common Issues**

### Error: "Execution Policy"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: "Cannot find path"

Use tab completion or verify the path exists:

```powershell
Test-Path ".\node_modules"
```

### Error: "Access denied"

Run PowerShell as Administrator, or add `-ErrorAction SilentlyContinue`:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
```

---

**Summary:**

- Use PowerShell's `Remove-Item -Recurse -Force` instead of `rm -rf`.
- Separate commands with `;` or run one per line.
- Most npm audit warnings in your logs are not under your direct control if they're from Firebase.
- Use the automation script `.\automation.ps1` for common tasks.

**Paste any future errors or command output here for help!**
