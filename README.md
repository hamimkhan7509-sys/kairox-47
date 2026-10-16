# mc-generator 🎮

> **Free AI Add-on & Skin Pack Generator for Minecraft Bedrock Edition (Pocket Edition on Android, iOS, Windows)**

**mc-generator** is a mobile-first web application that allows Minecraft Bedrock players to turn plain-text ideas into real, installable `.mcpack`, `.mcaddon`, and `.mcstructure` files that open directly in their game.

---

## ⚖️ Legal & Brand Notice
- **Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.**
- Minecraft is a trademark of Mojang Synergies AB / Microsoft Corporation.
- "mc-generator" does not include or reproduce Mojang's proprietary code, textures, sounds, or artwork. All generated textures and models are 100% original.

---

## 👤 Creator Credits
- **Created by:** Kairox 47
- **YouTube Channel:** [https://www.youtube.com/@kairox47](https://www.youtube.com/@kairox47)
- Credit configuration is located in `src/config.ts`.
- Generated manifests include attribution metadata (`authors: ["Kairox 47"]`), which can be disabled in Settings at any time with no restrictions.

---

## 🚀 Key Features

1. **Skin Pack Generator (`.mcpack`):**
   - Natural language AI prompts with "Improve my prompt" expansion using `gemini-3.8-flash`.
   - Generates authentic 64x64 dual-layer Bedrock skin UV maps.
   - Real-time 3D rotating preview with Three.js (Steve and Alex slim models, limb animations, 3D armor overlays).
   - In-browser 2D Pixel Editor with zoom, pencil, eraser, fill bucket, eyedropper, palette swatches, and undo/redo.
   - Multi-skin packs (up to 10 skins per pack).
   - JSZip packaging with RFC4122 v4 UUIDs, `manifest.json`, `skins.json`, and `texts/en_US.lang`.

2. **Honest Download Gateway (`<AdSlot />`):**
   - 5-second visible countdown with real skip button and clean Google AdSense placeholder.
   - No fake buttons, virus alerts, or trick clicks.

3. **Install Guide:**
   - Step-by-step instructions for Android (Pocket Edition), iOS (iPhone/iPad Safari), and Windows 10/11 Bedrock.

4. **Offline & PWA:**
   - Installable Progressive Web App with Web App Manifest and offline detection.
   - Local creation history saved to `localStorage` (no account required).

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- A Google Gemini API Key (`GEMINI_API_KEY`)

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root:
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

### 4. Start Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000` running Express with Vite middlewares mounted.

---

## 🚢 Deployment Guide

### Option 1: Google Cloud Run (Recommended for Full-Stack)
1. Build the production client bundle:
   ```bash
   npm run build
   ```
2. Set `NODE_ENV=production` and start the server:
   ```bash
   NODE_ENV=production npm start
   ```
3. Cloud Run automatically exposes port 3000 and injects `GEMINI_API_KEY` from Google Secret Manager.

### Option 2: Vercel / Netlify
1. Build output directory is `dist`.
2. Map server routes (`/api/*`) to Serverless Functions using the Express handlers or Vercel Edge functions with `GEMINI_API_KEY` configured in the project dashboard.
