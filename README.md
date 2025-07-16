# Justice Dashboard

> Open-source legal document analysis tool with AI-driven tagging and summaries.

A legal-tech tool for organizing and summarizing case documents, powered by OpenAI GPT-4 and scripture-aligned legal responses.

## Features

- Upload and summarize legal PDFs
- Auto-detect key legal issues and tags (e.g., due process, CPS misconduct)
- Export summaries and tags to CSV
- Store prayer/intent for each case
- Ask LawGPT for legal and Bible-based perspective

## Setup

**For Linux/macOS/WSL:**

```bash
npm install
```

**For Windows PowerShell:**

```powershell
npm install
```

Create a `.env` file in the root:

**For Linux/macOS/WSL:**

```bash
cp .env.example .env
```

**For Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**For Windows Command Prompt:**

```cmd
copy .env.example .env
```

Then edit `.env` with your values:

```bash
OPENAI_API_KEY=your-key-here
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
PORT=3000
```

Run the server:

**For Linux/macOS/WSL:**

```bash
npm start
```

**For Windows PowerShell:**

```powershell
npm start
```

Then visit <http://localhost:3000>

## Justice Dashboard Setup

## 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/justice-dashboard.git
cd justice-dashboard
npm install
```

## 2. Create required folders

```bash
mkdir -p uploads
mkdir -p client/dist
```

## 3. Start server

```bash
node server.js
```

App will be available at: [http://localhost:3000](http://localhost:3000)

## Legal Notes

This project is released under the [MIT License](./LICENSE).
All AI-assisted code was reviewed and assembled by the project author.
Some parts of the logic (e.g., file upload, CSV export) may resemble standard implementations from public tutorials or GitHub repositories.

If any portions appear similar to external sources, they are functionally generic and used under fair and standard development practices.

## Credits

- PDF parsing: [pdf-parse](https://www.npmjs.com/package/pdf-parse)
- AI summarization: [OpenAI API](https://platform.openai.com/)
- Scripture/legal alignment via LawGPT endpoint

## Version History

- **v1.0.0**: Initial release with core document processing features
- Bulk PDF upload and processing
- Auto-categorization and child detection
- Misconduct type classification
- CSV export functionality
- Production-ready Tailwind CSS build

---

## 🤝 Contributing

We welcome community contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🛡 License

This project is licensed under the [MIT License](LICENSE).

## 📧 Support

For questions or support, please open an issue on GitHub.

