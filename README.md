# Justice Dashboard

> Open-source legal document analysis tool with AI-driven tagging and summaries.

## Quick start

```bash
npm install            # install server & build tools
npx tailwindcss -i style.css -o output.css --watch   # one-time or dev CSS build
npm run dev            # nodemon server.js
```

Then visit [http://localhost:3000](http://localhost:3000)

## Legal Notes

This project is released under the [MIT License](./LICENSE).  
All AI-assisted code was reviewed and assembled by the project author.  
Some parts of the logic (e.g., file upload, CSV export) may resemble standard implementations from public tutorials or GitHub repositories.

If any portions appear similar to external sources, they are functionally generic and used under fair and standard development practices.

## Credits

- PDF parsing: [pdf-parse](https://www.npmjs.com/package/pdf-parse)
- AI summarization: [OpenAI API](https://platform.openai.com/)
- Scripture/legal alignment via LawGPT endpoint
