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
      const text = req.query.text as string;
      const lang = (req.query.lang as string) || "th";

      if (!text) {
        res.status(400).json({ error: "Text parameter is required" });
        return;
      }

      // Google Translate TTS URL
      // client=tw-ob or client=gtx works for public stream
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=gtx`;

      const response = await fetch(ttsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/"
        }
      });

      if (!response.ok) {
        console.error("Google TTS response not OK:", response.status, response.statusText);
        res.status(response.status).json({ error: "Failed to fetch TTS from Google" });
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
