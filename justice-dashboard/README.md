# Justice Dashboard

A web-based application for managing and analyzing justice-related documents with intelligent categorization, child detection, misconduct type assignment, and optional AI-powered summaries and tagging.

---

## 🚀 Quick Start

1. **Install Node.js** (v16 or higher)
2. **Install dependencies:**

   ```powershell
   npm install
   ```
3. **Build Tailwind CSS:**

   ```powershell
   npm run build:css
   ```
4. **Start the application:**

   * **Client-only:** Open `justice-dashboard/index.html` in your browser
   * **With backend:**

     ```powershell
     node backend/server.js
     ```

     Visit [http://localhost:3000](http://localhost:3000)

---

## 🌟 Features

* **Bulk PDF Upload:** Upload and process multiple legal documents at once
* **Auto-Categorization:** Classifies documents as Medical, School, Legal, or General
* **Child Detection:** Identifies Jace, Josh, Both, or Unknown based on document text
* **Misconduct Classification:** Assigns misconduct types (abuse, neglect, etc.)
* **AI Summarization:** Optional AI-powered document summaries and keyword tagging (requires OpenAI key)
* **CSV Export:** Download your processed and classified results
* **Accessibility:** ARIA labels, keyboard navigation, and readable contrast
* **Modern UI:** Fast, responsive, and easy-to-use interface with Tailwind CSS
* **Faith Integration:** Add prayers or scripture per case (optional)

---

## 📁 Project Structure

```text
justice-dashboard/
├── backend/                  # Backend server (Express, AI features)
│   └── server.js             # Main Express server
├── frontend/                 # Frontend app files
│   ├── dist/                 # Built CSS output
│   ├── styles.css            # Tailwind CSS source
│   └── ...                   # Other frontend assets
├── index.html                # Main app (served directly or by Express)
├── script.js                 # Main client JS logic
├── users.json                # User accounts (do not commit in production)
├── package.json              # NPM scripts, dependencies
├── postcss.config.js         # PostCSS config
├── tailwind.config.js        # Tailwind config
└── README.md                 # Project instructions (this file)
```

---

## ⚙️ Prerequisites

* **Node.js** (v16 or higher recommended; works with v22.x)
* **npm** (comes with Node.js)
* **Modern browser:** Chrome, Firefox, Edge, Safari (no IE support)

---

## 🔧 Installation & Setup

1. **Clone the project:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/justice-dashboard.git
   cd justice-dashboard
   ```
2. **Install NPM dependencies:**

   ```bash
   npm install
   ```
3. **Create required folders (if not present):**

   ```bash
   mkdir -p uploads
   mkdir -p frontend/dist
   ```
4. **Build CSS:**

   ```bash
   npm run build:css
   ```
5. **(Optional) Set up environment variables:**

   * Copy `.env.example` to `.env` and set keys:

     ```
     OPENAI_API_KEY=your-openai-api-key
     JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
     PORT=3000
     ```

---

## 🏃 Development & Usage

* **Client-only mode:**

  * Open `index.html` in your browser (no server needed for basic features)
* **Full backend mode (AI features):**

  * Run `node backend/server.js` and open [http://localhost:3000](http://localhost:3000)
* **Watch CSS during development:**

  * `npm run watch:css`

---

## 📝 Key Features (How-To)

* **Upload PDFs:** Click "Choose Files" to upload multiple PDFs for batch processing
* **Review Classifications:** Auto-detected categories, children, and misconduct types shown per file
* **Edit & Tag:** Adjust categories/misconduct, add notes, and assign child tags manually if needed
* **Export:** Download full analysis as CSV
* **Faith & Encouragement:** Store prayers or intentions for each document
* **AI Summaries:** If OpenAI API key is set, generate AI-powered summaries (backend mode only)

---

## 🛠 Developer Notes

* **Scripts:** See `package.json` for build, lint, deploy, and test commands
* **.nojekyll:** If deploying static files to GitHub Pages, create a `.nojekyll` file in the root to disable Jekyll
* **users.json:** Do NOT commit real user passwords to GitHub in production

---

## ⚠️ Troubleshooting

* **CSS not loading?** Run `npm run build:css` and open `index.html` from `frontend/dist/`
* **Backend won’t start?** Ensure Node version >=16, all env vars are set, and `uploads/` folder exists
* **Browser errors?** Use Chrome/Firefox for best support; clear cache if UI is outdated
* **Large files?** For very large PDFs, process in smaller batches to avoid browser memory issues

---

## 🔒 Security & Privacy

* **Client-only:** All processing happens in the browser unless backend is enabled
* **No data sent externally** unless server/AI features are enabled by you
* **User data and uploads** are ignored by `.gitignore` and never tracked in source control

---

## 🌍 Production/Deployment

* **Static hosting:** Place everything in `/frontend/dist` or root, and serve `index.html` statically
* **Firebase deploy:** Use `npm run deploy:firebase` (see `firebase.json` if present)
* **Vercel deploy:** Use `npm run deploy:vercel` (add a `vercel.json` for custom config)

---

## 📜 License

MIT License (see `LICENSE`)

---

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/something`)
3. Make and test your changes
4. Build and lint: `npm run lint` / `npm run build:css`
5. Commit and push
6. Open a Pull Request on GitHub

---

## 📧 Support / Questions

* Open an issue on GitHub
* For security, legal, or technical questions, email the project maintainer

---

## Version History

* **v1.0.0**: Initial release with core document processing features, auto-classification, child detection, misconduct tagging, and CSV export
