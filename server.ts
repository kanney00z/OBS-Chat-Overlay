import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // In-Memory Timer State
  interface TimerState {
    secondsRemaining: number;
    isActive: boolean;
    lastUpdated: number;
  }

  let timerState: TimerState = {
    secondsRemaining: 300, // 5 minutes default
    isActive: false,       // starts stopped/paused
    lastUpdated: Date.now()
  };

  // Helper to fetch computed seconds remaining
  const getSecondsRemaining = () => {
    if (!timerState.isActive) {
      return timerState.secondsRemaining;
    }
    const elapsedSeconds = Math.floor((Date.now() - timerState.lastUpdated) / 1000);
    return Math.max(0, timerState.secondsRemaining - elapsedSeconds);
  };

  // GET API to retrieve current timer status
  app.get("/api/timer", (req, res) => {
    res.json({
      secondsRemaining: getSecondsRemaining(),
      isActive: timerState.isActive,
      lastUpdated: timerState.lastUpdated
    });
  });

  // POST API to control and update the timer
  app.post("/api/timer/action", (req, res) => {
    try {
      const { action, seconds } = req.body;

      if (!action) {
        res.status(400).json({ error: "Missing action parameter" });
        return;
      }

      const activeSecondsRemaining = getSecondsRemaining();

      if (action === "start") {
        timerState.secondsRemaining = activeSecondsRemaining;
        timerState.isActive = true;
        timerState.lastUpdated = Date.now();
      } else if (action === "pause") {
        timerState.secondsRemaining = activeSecondsRemaining;
        timerState.isActive = false;
        timerState.lastUpdated = Date.now();
      } else if (action === "setTime") {
        timerState.secondsRemaining = Math.max(0, Number(seconds) || 0);
        timerState.lastUpdated = Date.now();
      } else if (action === "addTime" || action === "add") {
        const delta = Number(seconds) || 0;
        timerState.secondsRemaining = Math.max(0, activeSecondsRemaining + delta);
        timerState.lastUpdated = Date.now();
      } else if (action === "subtract") {
        const delta = Number(seconds) || 0;
        timerState.secondsRemaining = Math.max(0, activeSecondsRemaining - delta);
        timerState.lastUpdated = Date.now();
      } else if (action === "reset") {
        const resetVal = Math.max(0, Number(seconds) || 300);
        timerState.secondsRemaining = resetVal;
        timerState.isActive = false;
        timerState.lastUpdated = Date.now();
      }

      res.json({
        secondsRemaining: getSecondsRemaining(),
        isActive: timerState.isActive,
        lastUpdated: timerState.lastUpdated,
        success: true
      });
    } catch (err: any) {
      console.error("Timer action failed:", err);
      res.status(500).json({ error: "Failed to perform timer action" });
    }
  });

  // API Route: Server-Side TTS Proxy to bypass CORS & Referer blocks
  app.get("/api/tts", async (req, res) => {
    try {
      let rawText = req.query.text as string;
      const lang = (req.query.lang as string) || "th";
      const clientApiKey = req.query.apiKey as string;
      const clientEngine = req.query.engine as string;

      if (!rawText) {
        res.status(400).json({ error: "Text parameter is required" });
        return;
      }

      // Truncate text to 150 characters (ideal TTS length limit for Google Translate & prevents 403 UI Blocks/414 URI errors)
      const text = rawText.substring(0, 150).trim();

      // Check if we should attempt premium Google Cloud TTS
      const apiKey = clientApiKey || process.env.GEMINI_API_KEY || "";
      let response: Response | null = null;

      if ((clientEngine === "google_cloud_premium" || clientApiKey) && apiKey) {
        console.log(`TTS: Attempting Premium Google Cloud Text-to-Speech API. Key length: ${apiKey.length}`);
        try {
          const cloudTtsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
          
          // Neural2 yields human-grade, state-of-the-art synthetic speech
          // Wavenet is also excellent, and standard is the cost-efficient one.
          // Let's use neural2 as standard tier, falling back to Wavenet / Standard if Neural2 throws quota errors.
          const cloudTtsBody = {
            input: { text: text },
            voice: {
              languageCode: lang === "th" ? "th-TH" : "en-US",
              name: lang === "th" ? "th-TH-Neural2-F" : "en-US-Neural2-F",
              ssmlGender: "FEMALE"
            },
            audioConfig: {
              audioEncoding: "MP3"
            }
          };

          const cloudRes = await fetch(cloudTtsUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(cloudTtsBody)
          });

          if (cloudRes.ok) {
            const data: any = await cloudRes.json();
            if (data.audioContent) {
              console.log(`TTS Premium success: Produced high-quality bytes for text: "${text.substring(0, 20)}..."`);
              const buffer = Buffer.from(data.audioContent, "base64");
              res.setHeader("Content-Type", "audio/mpeg");
              res.setHeader("Content-Length", buffer.length);
              res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
              res.send(buffer);
              return;
            }
          } else {
            const errorText = await cloudRes.text();
            console.warn(`Premium Google Cloud TTS returned non-OK status (${cloudRes.status}):`, errorText);
            // Don't crash, let it cascade down to free scrapers so the user's overlay remains operational!
          }
        } catch (cloudErr) {
          console.error("Failed to fetch from premium Google Cloud Text-to-Speech API:", cloudErr);
        }
      }

      // Attempt 1: Highly stable translate.googleapis.com with client=gtx
      // This is Google's official extension endpoint. It is extremely resilient to cloud IP rate-limiting,
      // especially when requested with standard/minimalist headers.
      console.log(`TTS Request: "${text}" [lang=${lang}]. Attempting translate.googleapis.com API with client=gtx...`);
      const apiDomain = "translate.googleapis.com";
      const apiTtsUrl = `https://${apiDomain}/translate_tts?ie=UTF-8&tl=${lang}&client=gtx&q=${encodeURIComponent(text)}`;
      try {
        response = await fetch(apiTtsUrl, {
          headers: {
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        });
      } catch (err) {
        console.warn("Failed to fetch translate.googleapis.com/gtx due to network error/block:", err);
      }

      // Attempt 2: Backup Google Translate client=tw-ob endpoint (domain: translate.google.com)
      if (!response || !response.ok) {
        console.warn(`TTS translate.googleapis.com/gtx failed (status ${response ? response.status : "thrown error"}). Trying translate.google.com with client=tw-ob...`);
        const googleDomain = "translate.google.com";
        const apiTtsUrlFallback = `https://${googleDomain}/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
        try {
          response = await fetch(apiTtsUrlFallback, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": `https://${googleDomain}/`
            }
          });
        } catch (err) {
          console.warn("Failed to fetch translate.google.com due to network error/block:", err);
        }
      }

      // Attempt 3: Bulletproof SoundOfText API Proxy fallback
      // Since SoundOfText is hosted externally, it is highly immune to local Cloud Run IP bans or Google captchas.
      if (!response || !response.ok) {
        console.warn(`TTS translate.google.com failed (status ${response ? response.status : "thrown error"}). Launching SoundOfText API Relay...`);
        try {
          const soundOfTextVoice = lang === "th" ? "th-TH" : "en-US";
          const sotRegisterRes = await fetch("https://api.soundoftext.com/sounds", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            body: JSON.stringify({
              engine: "gtts",
              data: {
                text: text,
                voice: soundOfTextVoice
              }
            })
          });

          if (sotRegisterRes.ok) {
            const sotData = await sotRegisterRes.json();
            if (sotData.success && sotData.id) {
              const soundId = sotData.id;
              console.log(`SoundOfText Sound registered successfully: ${soundId}. Waiting for completion...`);

              // Poll or fetch SoundOfText link (usually completed nearly instantly)
              let downloadUrl = "";
              for (let i = 0; i < 5; i++) {
                const sotStatusRes = await fetch(`https://api.soundoftext.com/sounds/${soundId}`);
                if (sotStatusRes.ok) {
                  const statusData = await sotStatusRes.json();
                  if (statusData.status === "done" && statusData.location) {
                    downloadUrl = statusData.location;
                    break;
                  }
                }
                // Sleep 150ms before polling
                await new Promise((resolve) => setTimeout(resolve, 150));
              }

              if (downloadUrl) {
                console.log(`Streaming SoundOfText MP3: ${downloadUrl}`);
                response = await fetch(downloadUrl);
              }
            }
          }
        } catch (sotErr) {
          console.error("SoundOfText fallback execution encountered a crash:", sotErr);
        }
      }

      if (!response || !response.ok) {
        console.error("Google TTS and SoundOfText failed completely:", response ? response.status : "No response", response ? response.statusText : "");
        res.status(response ? response.status : 500).json({ error: "Failed to generate TTS audio stream across all 3 providers." });
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Set headers for audio stream
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      res.send(buffer);
    } catch (err: any) {
      console.error("TTS proxy error:", err);
      res.status(500).json({ error: "Internal server error during TTS generation" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
