import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Secure API Proxy for Gemini
app.post('/api/gemini', async (req, res) => {
  const { parts, maxTokens } = req.body;
  if (!process.env.VITE_GEMINI_KEY) {
    return res.status(500).json({ error: 'GEMINI_KEY is not configured on the server.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.VITE_GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens || 800 }
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: 'Failed to communicate with Gemini API' });
  }
});

// Secure API Proxy for Google Cloud Vision
app.post('/api/vision', async (req, res) => {
  const { b64, mime } = req.body;
  const key = process.env.VITE_VISION_KEY || process.env.VITE_GEMINI_KEY;
  if (!key) {
    return res.status(500).json({ error: 'VISION_KEY is not configured on the server.' });
  }

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: b64 },
          features: [{ type: 'WEB_DETECTION', maxResults: 15 }]
        }]
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Vision API Error:', error);
    res.status(500).json({ error: 'Failed to communicate with Vision API' });
  }
});

// Serve static frontend files in production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Secure MediaDNA backend running on port ${PORT}`);
});
