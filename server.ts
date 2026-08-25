import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './src/server/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// API Middleware
app.use(async (req, res, next) => {
  if (req.url && req.url.startsWith('/api')) {
    const handled = await handleApiRequest(req, res);
    if (handled) return;
  }
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`PurpleTalk Server running on http://${HOST}:${PORT}`);
});
