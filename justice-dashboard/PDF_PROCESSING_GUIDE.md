# PDF Input & Output Setup Guide

This guide explains how to provide the **input** and **output** PDF paths when running the `Update-PDFLinks` automation (Menu Option 5).

---

## 1. Input PDF (Source)

### A. Default Locations

Your script will scan these folders for source PDFs before prompting:

* `server\uploads\`
* `uploads\`
* Project root (`.`)

Place your file there and rename it to `old.pdf` for convenience, or leave the original name.

### B. Manual Path Entry

If no files are detected, you'll be asked:

```
Enter input PDF file path:
```

Type the **absolute path** to your PDF, for example:

```text
C:\Users\ssped\Documents\misconduct.pdf
```

---

## 2. Output PDF (Destination)

After entering the input path, you'll be asked:

```
Enter output PDF file path (or press Enter for default):
```

* **Press Enter** to accept the default:

  ```text
  MCL, Federal Law- Misconduct Analysis (2).pdf
  ```
* **Or** specify a custom path/name:

  ```text
  C:\Users\ssped\Desktop\UpdatedMisconductAnalysis.pdf
  ```

The output file will be written to the current working directory or the path you specify.

---

## 3. Menu Flow Example

1. From the main menu, press **5** (Update PDF links).
2. If no PDFs found, you see:

   ```text
   Available PDF files:
   No PDF files found in common locations.
   Expected: server\uploads\, uploads\, .
   Enter input PDF file path:
   ```
3. Type:

   ```text
   C:\Users\ssped\Documents\misconduct.pdf
   ```
4. Next prompt:

   ```text
   Enter output PDF file path (or press Enter for default):
   ```
5. Press **Enter** (for default) or type a new path.
6. Script processes and reports success or error.

---

## 4. Troubleshooting

* **Error: Input file not found**
  • Verify the path is correct and file exists.
  • Surround paths with quotes if they contain spaces.

* **Permission Denied**
  • Ensure you have read/write permissions on the specified folders.

* **Unexpected Output Name**
  • Double-check the output path prompt; press Enter only if you want the default name.

---

## 5. Common PDF Processing Tasks

### For Court Documents
```text
Input:  server\uploads\1751231212352-2.21.24_Referee_Recommendation_and_Order_RE_Child_Support__1_.pdf
Output: Updated_Court_Order_2024.pdf
```

### For Legal Responses
```text
Input:  server\uploads\1751231212020-2.16.24_Plaintiff_s_Response_and_POS_SUPPORT.pdf
Output: Updated_Legal_Response.pdf
```

### For General Analysis
```text
Input:  C:\Documents\original_misconduct_analysis.pdf
Output: MCL_Federal_Law_Misconduct_Analysis_Updated.pdf
```

---

Keep this reference handy when using **Option 5** to update your PDF links and bookmarks.

## Quick Reference Commands

**Direct command line usage:**
```powershell
# Process a specific file
python update_pdf_links.py "input.pdf" "output.pdf"

# Use default output name
python update_pdf_links.py "input.pdf"
```

**NPM script usage:**
```powershell
# Test PDF processing capabilities
npm run test-pdf

# Use automation menu
.\automation.ps1
```
