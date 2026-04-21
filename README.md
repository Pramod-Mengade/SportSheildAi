# MediaDNA AI — Digital Sports Media Protection 🧬

MediaDNA AI is an advanced, full-stack prototype designed to protect digital sports media assets from unauthorized use, piracy, and copyright infringement. It leverages local DNA steganography (invisible watermarking) combined with Google Gemini's AI threat analysis and Cloud Vision's internet-wide web detection.

## 🚀 Key Features
- **DNA Steganography**: Embeds invisible, cryptographically secure metadata directly into the pixel data of images.
- **AI Threat Analysis**: Uses Google Gemini 1.5 Flash to automatically analyze assets, generate threat vectors, and calculate a Piracy Risk Score.
- **Global Internet Scan**: Utilizes Google Cloud Vision to scan the entire internet for unauthorized copies of your protected media.
- **Automated Evidence Packages**: Generates legally sound DMCA takedown notices and visualizes the unauthorized propagation of assets via a branching node map.
- **Secure Architecture**: Implements a full-stack architecture with a Node.js Express backend to ensure critical API keys remain 100% hidden and secure.

---

## 📂 Project Structure

```text
MediaDNA-AI/
├── src/                # Frontend source code
│   ├── main.js         # Core application logic, steganography, and API integrations
│   └── css/            
│       └── style.css   # Premium glassmorphism UI styles and animations
├── index.html          # Main HTML entry point
├── package.json        # Project dependencies and deployment scripts
├── server.js           # Secure Node.js Express backend for API proxying
├── vite.config.js      # Vite build and proxy configuration
├── .env                # Local environment variables (Hidden from GitHub)
├── PROJECT_DECK.md     # Presentation deck for the solution architecture
└── README.md           # This documentation file
```

---

## 🛠️ How to Run Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_GEMINI_KEY=your_gemini_api_key
   VITE_VISION_KEY=your_cloud_vision_api_key
   ```
   *(Note: You must also configure your `window.FB_CFG` in `src/main.js` or `index.html` with your Firebase project details).*

3. **Start the Full-Stack Server**
   ```bash
   npm run dev
   ```
   This will simultaneously start the secure Node.js backend (Port 3000) and the Vite frontend (Port 5173). Open `http://localhost:5173` in your browser.

---

## 🌐 How to Deploy (To get your Prototype Link)

Because this application utilizes a secure backend to hide API keys, it is designed to be deployed effortlessly to **Render.com** or **Railway.app** as a Full-Stack Web Service.

**Deployment Steps for Render.com:**
1. Upload this entire project to a public **GitHub** repository.
2. Go to [Render.com](https://render.com/) and create a free account.
3. Click **New +** and select **Web Service**.
4. Connect your GitHub account and select this repository.
5. Configure the service:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Scroll down to **Environment Variables** and add:
   - `VITE_GEMINI_KEY` (Your Gemini Key)
   - `VITE_VISION_KEY` (Your Cloud Vision Key)
7. Click **Create Web Service**. 

Render will build and deploy your app. Once finished, they will provide you with a live URL (e.g., `https://mediadna-ai.onrender.com`). This is your final **Prototype Link**!

---

*Developed for the Advanced Agentic AI Prototype Submission.*
