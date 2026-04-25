# 🧬 MediaDNA AI — SportShield
### *Advanced Digital Sports Media Protection & IP Tracking*

MediaDNA AI is a production-ready prototype designed to solve the multi-billion dollar problem of sports media piracy. It combines **invisible steganography**, **perceptual fingerprinting**, and **Multi-Agent AI** to detect, track, and flag unauthorized content across the global internet in real-time.

---

## 💎 The "MediaDNA" Innovation
Unlike standard watermarking, MediaDNA implements a **Triple-Layer Defense**:

1.  **Layer 1: Invisible DNA (LSB Steganography)**  
    Embeds cryptographically secure ownership data directly into the pixel values. This data is invisible to the human eye but survives cropping, resizing, and re-compression.
2.  **Layer 2: Perceptual Fingerprinting (Average Hash)**  
    Generates a unique digital "DNA sequence" based on visual structure, allowing the system to identify the same image even if the colors are altered or filters are applied.
3.  **Layer 3: AI Threat Intelligence (Gemini + Vision)**  
    Utilizes **Google Cloud Vision** for internet-wide tracking and **Google Gemini 1.5 Flash** to analyze propagation patterns, detect commercial misuse, and auto-generate legal evidence packages.

---

## 🚀 Key Features

- **🌐 Global Internet Tracking**: Scans Twitter, Instagram, news sites, and blogs for unauthorized copies using Google's Web Detection technology.
- **🌳 Propagation Mapping**: Visualizes the spread of your content via a branching node graph, identifying "Patient Zero" for piracy leaks.
- **⚡ Anomaly Detection**: AI-driven monitoring that flags "Viral Propagation" and "Commercial Misuse" automatically.
- **⚖️ Auto-Legal Engine**: Generates pre-filled, legally sound DMCA and IT Act (India) takedown notices based on detected evidence.
- **🔒 Secure Proxy Architecture**: A full-stack Node.js backend ensures all sensitive AI and Vision API keys are hidden from the client, preventing key leakage.
- **🛠️ System Integrity Check**: Built-in diagnostic suite to validate steganography logic and API health.

---

## 📂 Project Architecture

```text
MediaDNA-AI/
├── src/                # Frontend (Vite + Vanilla JS)
│   ├── main.js         # Core Engine (DNA, Fingerprinting, UI)
│   ├── tests.js        # Diagnostic Test Suite
│   └── css/style.css   # Premium Design System (Glassmorphism)
├── server.js           # Secure Node.js Proxy (Express)
├── Dockerfile          # Production-ready containerization
├── package.json        # Dependencies & Scripts
└── vitest.config.js    # Automated Testing Configuration
```

---

## 🛠️ Deployment & Execution

### Local Development
1. `npm install`
2. Create `.env` with `GEMINI_API_KEY` and `GOOGLE_VISION_API_KEY`.
3. `npm run dev` (Starts both Vite and Express).

### Production (Cloud Run / Render)
The project is Docker-optimized and ready for one-click deployment.
- **Build**: `npm run build`
- **Start**: `npm start`
- **Environment**: Ensure keys are set as environment variables in your cloud provider.

---

*Developed for the Google Solution Challenge / Advanced AI Prototype Submission.*  
**Team Fusion — 2026**
