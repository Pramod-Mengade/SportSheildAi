import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();


async function getBase64FromUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error in getBase64FromUrl:', error);
    throw error;
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check — used by frontend to detect if backend is running
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '2.0', keys: { gemini: !!process.env.GEMINI_API_KEY, vision: !!process.env.GOOGLE_VISION_API_KEY } });
});

// Secure API Proxy for Gemini
app.post('/api/gemini', async (req, res) => {
  const { parts, maxTokens } = req.body;
<<<<<<< HEAD
  console.log('[DEBUG] Gemini Key Exists:', !!process.env.GEMINI_API_KEY);
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing from environment variables' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
=======
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
>>>>>>> c3e3017 (changes added)
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens || 800 }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || JSON.stringify(data.error || data);
      console.error('[SERVER ERROR] Gemini API:', errorMsg);
      throw new Error(errorMsg);
    }
    
    res.json(data);
  } catch (error) {
    console.error('[DEBUG] Gemini Catch Block:', error.message);
    
    // Fallback Mock Response logic for demo purposes
    const promptStr = JSON.stringify(parts).toLowerCase();
    let mockText = "{}";
    
    if (promptStr.includes("fingerprint") || promptStr.includes("elements")) {
      mockText = JSON.stringify({ description: "Fallback mock description.", sport: "Unknown", elements: ["mock1"], colors: ["black", "white"], uniqueMarkers: ["mock"], commercialValue: "MEDIUM", riskFactors: ["mock risk"], searchKeywords: ["mock"] });
    } else if (promptStr.includes("anomaly")) {
      mockText = JSON.stringify({ anomalyDetected: true, severity: "MEDIUM", anomalies: [{type:"mock", description:"Fallback mock anomaly", urgency:"MONITOR"}], rootSource: "unknown", propagationPattern: "organic", estimatedReach: "1000", recommendedAction: "Monitor" });
    } else if (promptStr.includes("verify") || promptStr.includes("theft")) {
      mockText = JSON.stringify({ isOfficialMedia: false, isCommercialMisuse: true, theftProbability: "HIGH", platformType: "blog", jurisdiction: "Unknown", dmcaApplicable: true, notes: "Fallback mock verify" });
    }

    // Return a structured mock response so the frontend doesn't crash
    res.json({
      candidates: [{
        content: { parts: [{ text: mockText }] }
      }]
    });
  }
});

// Secure API Proxy for Google Cloud Vision
app.post('/api/vision', async (req, res) => {
  const { b64, mime } = req.body;
  const key = process.env.GOOGLE_VISION_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'GOOGLE_VISION_API_KEY is not configured on the server.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: b64 },
          features: [{ type: 'WEB_DETECTION' }]
        }]
      })
    });
    clearTimeout(timeout);
    const data = await response.json();
    if (!response.ok || data.error) {
      const msg = data.error?.message || JSON.stringify(data.error || data);
      console.error('[SERVER ERROR] Vision API:', msg);
      return res.status(response.status || 500).json({ error: msg });
    }
    res.json(data);
  } catch (error) {
<<<<<<< HEAD
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.error('Vision API timeout');
      return res.status(408).json({ 
        error: 'Vision API timeout',
        message: 'Scan took too long. Try again.' 
      });
    }
    console.error('Vision Error Detail:', error);
    res.status(500).json({ error: 'Failed to communicate with Vision API. Details: ' + error.message });
  }
});

// Proxy for fetching external images to avoid CORS issues
app.get('/api/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`External image fetch failed: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    const buffer = Buffer.from(await response.arrayBuffer());
    
    res.set('Content-Type', contentType);
    res.send(buffer);
  } catch (error) {
    console.error('Proxy Image Error:', error);
    res.status(500).json({ error: 'Failed to proxy image: ' + error.message });
  }
});

=======
    console.error('Vision Error:', error);
    res.status(500).json({ error: 'Failed to communicate with Vision API' });
  }
});

>>>>>>> c3e3017 (changes added)
// FEATURE 1: Self-reporting beacon
const beaconHits = [];
app.get('/beacon/:assetId', (req, res) => {
  const assetId = req.params.assetId;
  const referer = req.get('Referer') || 'Direct/Unknown';
  const ip = req.ip || req.connection.remoteAddress;
  beaconHits.push({ id: Date.now().toString(), assetId, timestamp: Date.now(), referer, ip });
  
  // 1x1 transparent PNG
  const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': buf.length });
  res.end(buf);
});

app.get('/api/beacons', (req, res) => {
  res.json(beaconHits);
});

// FEATURE 2: Match-Day surge mode cache
let currentMatches = [];
<<<<<<< HEAD
let lastFetch = 0;
let nextMatchStart = null;
app.get('/api/match-day', async (req, res) => {
  const now = Date.now();
  // Refresh cache if empty OR older than 1 hour
  if (currentMatches.length === 0 || (now - lastFetch) > 3600000) {
=======
let nextMatchStart = null;
app.get('/api/match-day', async (req, res) => {
  if (currentMatches.length === 0) {
>>>>>>> c3e3017 (changes added)
    try {
      const key = process.env.CRICAPI_KEY;
      if (key) {
        const resp = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`);
        const data = await resp.json();
<<<<<<< HEAD
        if (data && data.data) {
          currentMatches = data.data;
          lastFetch = Date.now();
        }
=======
        if (data && data.data) currentMatches = data.data;
>>>>>>> c3e3017 (changes added)
      } else {
        // Mock match for demo purposes
        currentMatches = [
          { name: "Demo Match: India vs Australia", dateTimeGMT: new Date(Date.now() + 7200000).toISOString(), teams: ["India", "Australia"] }
        ];
      }
    } catch (e) {
      console.error('CricAPI Error:', e);
    }
  }
  
<<<<<<< HEAD
=======
  const now = Date.now();
>>>>>>> c3e3017 (changes added)
  let nextMatch = null;
  for (const m of currentMatches) {
    const t = new Date(m.dateTimeGMT).getTime();
    if (t > now && (!nextMatch || t < nextMatch)) {
      nextMatch = t;
    }
  }
  nextMatchStart = nextMatch;

  res.json({ matches: currentMatches, nextMatchStart });
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
