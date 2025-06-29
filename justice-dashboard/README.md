# Justice Dashboard

A web-based application for managing and analyzing justice-related documents with intelligent categorization, child detection, and misconduct type assignment.

## Quick Start

1. **Install Node.js** (if not already installed)

2. **Navigate to project folder**:

   ```powershell
   cd c:\path\to\justice-dashboard\justice-dashboard
   ```

3. **Install dependencies**:

   ```powershell
   npm install
   ```

4. **Build CSS**:

   ```powershell
   npm run build:css
   ```

5. **Open application**: Navigate to `justice-dashboard/index.html` in your browser

That's it! The dashboard is ready to use.

## Features

- **Bulk PDF Upload**: Upload multiple PDF files simultaneously
- **Auto-Categorization**: Automatically categorizes documents into Medical, School, Legal, or General
- **Child Detection**: Identifies documents related to Jace, Josh, Both, or Unknown
- **Misconduct Classification**: Assigns misconduct types with AI-powered keyword detection
- **CSV Export**: Export analysis results for further processing
- **Accessibility**: ARIA labels and keyboard navigation support
- **Modern UI**: Clean, responsive design with Tailwind CSS

## Project Structure

```text
justice-dashboard/
├── justice-dashboard/           # Main web app
│   ├── dist/                   # Compiled CSS
│   │   └── styles.css         # Production Tailwind CSS
│   ├── index.html             # Main application (production)
│   ├── index-working.html     # Development version with CDN fallback
│   ├── script.js              # Application logic
│   └── styles.css             # Source Tailwind CSS
├── justice-server/             # Optional server (for AI features)
│   └── server.js              # Express server with AI summarization
├── package.json               # Dependencies and build scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── README.md                  # This file
```

## Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

1. **Clone or download the project** to your local machine

2. **Navigate to the project directory**:

   ```powershell
   cd c:\path\to\justice-dashboard\justice-dashboard
   ```

3. **Install dependencies**:

   ```powershell
   npm install
   ```

## Development Setup

### Building CSS (Required)

The application uses Tailwind CSS for styling. You need to compile the CSS before running the application:

```powershell
# Build CSS once
npm run build:css

# Or watch for changes during development
npm run watch:css
```

### Running the Application

#### Client-Only Mode (Recommended)

1. **Build the CSS** (if not already done):

   ```powershell
   npm run build:css
   ```

2. **Open the application** in your browser:
   - Navigate to `justice-dashboard/index.html`
   - Or use VS Code's Live Server extension
   - Or serve via any local web server

#### Server Mode (Optional - for AI features)

If you want to use the optional server for AI-powered document summarization:

1. **Set up environment variables**:
   
   Create a `.env` file in the root directory:
   
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```
   
   **Note**: Without `OPENAI_API_KEY`, the server will run but AI summarization will be disabled. Documents will still be processed with basic categorization.

2. **Start the server**:

   ```powershell
   node justice-server/server.js
   ```

3. **Open the application** at `http://localhost:3000`

## Usage

### Basic Document Processing

1. **Upload Documents**:
   - Click "Choose Files" to select PDF files
   - Multiple files can be selected at once
   - Files are processed client-side for privacy

2. **Review Auto-Classification**:
   - Documents are automatically categorized based on filename
   - Child detection identifies relevant subjects
   - Misconduct types are suggested based on keywords

3. **Manual Adjustments**:
   - Use dropdown menus to adjust categories
   - Modify misconduct types as needed
   - Add notes for specific documents

4. **Export Results**:
   - Click "Export to CSV" to download analysis results
   - CSV includes all classification data and metadata

### Category Classification

Documents are automatically classified into:

- **Medical**: Healthcare, therapy, psychiatric records
- **School**: Educational records, IEPs, report cards
- **Legal**: Court documents, legal proceedings
- **General**: Other document types

### Child Detection

The system identifies documents related to:

- **Jace**: Documents containing "jace" in filename
- **Josh**: Documents containing "josh" in filename  
- **Both**: Documents containing both names
- **Unknown**: Documents with unclear associations

### Misconduct Types

Available misconduct classifications:

- Physical Abuse
- Emotional Abuse
- Neglect
- Educational Neglect
- Medical Neglect
- Inappropriate Supervision
- Failure to Protect
- Substance Abuse
- Domestic Violence
- Other/Multiple

## Development

### CSS Development

The project uses Tailwind CSS with a custom build process and optimized browser compatibility:

1. **Source CSS**: `justice-dashboard/styles.css`
2. **Compiled CSS**: `justice-dashboard/dist/styles.css`  
3. **Configuration**: `tailwind.config.js`, `postcss.config.js`, and `browserslist` in `package.json`
4. **Browser Support**: Modern browsers (Chrome 54+, Firefox 60+, Safari 12+, Edge 79+)

To make style changes:

1. Edit `justice-dashboard/styles.css`
2. Run `npm run watch:css` for live rebuilding
3. Or run `npm run build:css` for one-time compilation

### JavaScript Development

The main application logic is in `justice-dashboard/script.js`. Key functions:

- `processFiles()`: Handles file upload and processing
- `categorizeDocument()`: Auto-categorization logic
- `detectChild()`: Child detection logic
- `exportToCSV()`: Data export functionality

## Troubleshooting

### CSS Not Loading

1. **Ensure CSS is built**:

   ```powershell
   npm run build:css
   ```

2. **Check file paths** - ensure `dist/styles.css` exists

3. **Use development version** - try `index-working.html` which uses CDN fallback

### Build Errors

1. **Clear node_modules and reinstall**:

   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```

2. **Check Node.js version**:

   ```powershell
   node --version
   npm --version
   ```

### Performance Issues

1. **Large file uploads**: The system processes files client-side, so very large PDFs may be slow
2. **Memory usage**: Processing many large files simultaneously may cause browser slowdown
3. **Recommendations**: Process files in smaller batches for optimal performance

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Internet Explorer**: Not supported

## Security & Privacy

- **Client-side processing**: Files are processed in the browser, not uploaded to servers
- **No data transmission**: Document content stays on your local machine
- **Privacy-first**: No external API calls for document processing (in client-only mode)

## Production Deployment

### Static Hosting

The application can be deployed to any static hosting service:

1. **Build CSS**:

   ```powershell
   npm run build:css
   ```

2. **Deploy files**:
   - `justice-dashboard/index.html`
   - `justice-dashboard/script.js`
   - `justice-dashboard/dist/styles.css`

3. **Supported platforms**:
   - GitHub Pages
   - Netlify
   - Vercel
   - AWS S3
   - Any web server

### Server Deployment

If using the optional server features:

1. **Environment setup** on your server
2. **Install dependencies**: `npm install --production`
3. **Start server**: `node justice-server/server.js`
4. **Configure reverse proxy** (nginx, Apache) if needed

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature-name`
3. **Make changes** and test thoroughly
4. **Build CSS**: `npm run build:css`
5. **Commit changes**: `git commit -am 'Add feature'`
6. **Push to branch**: `git push origin feature-name`
7. **Create Pull Request**

## License

This project is released under the **MIT License** (see `LICENSE`).

## Support

For issues, questions, or feature requests:

1. **Check troubleshooting section** above
2. **Review browser console** for error messages
3. **Verify CSS build** completed successfully
4. **Test with development version** (`index-working.html`)

## Version History

- **v1.0.0**: Initial release with core document processing features
- Bulk PDF upload and processing
- Auto-categorization and child detection
- Misconduct type classification
- CSV export functionality
- Production-ready Tailwind CSS build
