const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(3001, () => console.log('api on 3001'));

