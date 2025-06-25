const express   = require('express');
const cors      = require('cors');
const multer    = require('multer');
const fs        = require('fs');
const path      = require('path');
const pdfParse  = require('pdf-parse');

const app    = express();
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.use(cors());
app.use('/files', express.static(path.join(__dirname, 'uploads')));

// POST /api/summarize
app.post('/api/summarize', upload.single('file'), async (req, res) => {
  const tempPath  = req.file.path;
  const cleanName = req.file.originalname.replace(/\s+/g, '_');
  const finalPath = path.join('uploads', cleanName);

  try {
    fs.renameSync(tempPath, finalPath);
    const text = (await pdfParse(fs.readFileSync(finalPath))).text.trim();

    res.json({
      summary: text.slice(0, 500) || 'No text found in PDF.',
      fileURL: `/files/${cleanName}`,
      fileName: req.file.originalname
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to summarise PDF.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅  API running on http://localhost:${PORT}`));