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
    const elapsedSeconds = (Date.now() - timerState.lastUpdated) / 1000;
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

  // Donation Alerts Shared State
  interface LiveAlert {
    id: string;
    type: string; // 'donate_alert' | 'chat' | 'follow' | 'gift' | 'like'
    uniqueId: string;
    nickname: string;
    comment?: string;
    amount?: number;
    diamondCount?: number;
    profilePictureUrl?: string;
    timestamp: number;
    isModerator?: boolean;
    isSubscriber?: boolean;
    isVip?: boolean;
  }

  let liveAlerts: LiveAlert[] = [];

  let streamerProfile = {
    phone: "0821062891",
    walletPhone: "0821062891",
    bankName: "กสิกรไทย (KBANK)",
    bankAccount: "738-2-19284-1",
    bankOwner: "ลันตา สตรีมเมอร์",
    name: "ลันตา สตรีมเมอร์",
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=300",
    bio: "สตรีมเมอร์สัญชาติไทย ยินดีต้อนรับทุกคนเข้าสู่คลังสนับสนุน OBS!"
  };

  // POST to trigger a live donation alert (or other alerts)
  app.post("/api/alerts", (req, res) => {
    try {
      const { type, nickname, comment, amount, profilePictureUrl, isModerator, isSubscriber, isVip, diamondCount } = req.body;
      const newAlert: LiveAlert = {
        id: "alert_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        type: type || 'donate_alert',
        uniqueId: 'donor_' + Date.now() + "_" + Math.floor(Math.random() * 100),
        nickname: nickname || 'ผู้สนับสนุนปริศนา',
        comment: comment || '',
        amount: amount !== undefined ? Number(amount) : undefined,
        diamondCount: diamondCount !== undefined ? Number(diamondCount) : undefined,
        profilePictureUrl: profilePictureUrl || '',
        isModerator: !!isModerator,
        isSubscriber: !!isSubscriber,
        isVip: !!isVip,
        timestamp: Date.now()
      };
      
      liveAlerts.push(newAlert);
      // Keep queue compact
      if (liveAlerts.length > 50) {
        liveAlerts.shift();
      }
      
      res.json({ success: true, alert: newAlert });
    } catch (err) {
      console.error("Failed to post alert:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET to poll for new alerts since a given timestamp
  app.get("/api/alerts", (req, res) => {
    try {
      const since = Number(req.query.since) || 0;
      const filtered = liveAlerts.filter(alert => alert.timestamp > since);
      res.json({ events: filtered, serverTime: Date.now() });
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET/POST Streamer profile for public view page
  app.get("/api/streamer/profile", (req, res) => {
    res.json(streamerProfile);
  });

  app.post("/api/streamer/profile", (req, res) => {
    try {
      const { phone, walletPhone, bankName, bankAccount, bankOwner, name, coverImage, bio } = req.body;
      if (phone !== undefined) streamerProfile.phone = String(phone);
      if (walletPhone !== undefined) streamerProfile.walletPhone = String(walletPhone);
      if (bankName !== undefined) streamerProfile.bankName = String(bankName);
      if (bankAccount !== undefined) streamerProfile.bankAccount = String(bankAccount);
      if (bankOwner !== undefined) streamerProfile.bankOwner = String(bankOwner);
      if (name !== undefined) streamerProfile.name = String(name);
      if (coverImage !== undefined) streamerProfile.coverImage = String(coverImage);
      if (bio !== undefined) streamerProfile.bio = String(bio);
      res.json({ success: true, profile: streamerProfile });
    } catch (err) {
      console.error("Failed to update profile:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Real-time Settings Sync for running OBS browser instances
  let serverOverlaySettings: any = null;

  app.get("/api/overlay/settings", (req, res) => {
    res.json(serverOverlaySettings || {});
  });

  app.post("/api/overlay/settings", (req, res) => {
    try {
      serverOverlaySettings = req.body;
      res.json({ success: true, settings: serverOverlaySettings });
    } catch (err) {
      console.error("Failed to update overlay settings:", err);
      res.status(500).json({ error: "Internal server error" });
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

      // 1. Check if client specifically requested cute TikTok girl voice
      if (clientEngine === "tiktok_cute" || (lang === "th" && clientEngine === "tiktok")) {
        console.log(`TTS: Utilizing public TikTok TTS worker for adorable Thai female voice: "${text.substring(0, 20)}..."`);
        try {
          const resTiktok = await fetch("https://tiktok-tts.weilnet.workers.dev/api/generation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            body: JSON.stringify({
              text: text,
              voice: "th_001" // Premium cute TikTok Thai Female voice
            })
          });

          if (resTiktok.ok) {
            const dataTiktok: any = await resTiktok.json();
            if (dataTiktok.success && dataTiktok.data) {
              console.log(`TTS TikTok (public worker) success: Generated cute female Thai audio`);
              const buffer = Buffer.from(dataTiktok.data, "base64");
              res.setHeader("Content-Type", "audio/mpeg");
              res.setHeader("Content-Length", buffer.length);
              res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
              res.send(buffer);
              return;
            } else {
              console.warn("TikTok public worker responded but success was false or data was empty, continuing fallbacks...");
            }
          } else {
            console.warn(`TikTok public worker responded with non-200: ${resTiktok.status}`);
          }
        } catch (tiktokError) {
          console.error("TikTok public worker synthesis failed, cascading standard fallbacks:", tiktokError);
        }
      }

      // Check if we should attempt premium Google Cloud TTS
      const apiKey = (clientApiKey || process.env.GEMINI_API_KEY || "").trim();
      let response: Response | null = null;

      // Smart detector: If key starts with "AQ.", it is a TikTok Session ID/Cookie!
      if (apiKey.startsWith("AQ.")) {
        console.log(`TTS: Automatically detected TikTok Session ID. Utilizing premium TikTok TTS for high-quality Thai voice...`);
        
        // Correct path is /media/api/text/speech/ or /media/api/text/speech/invoke/ (trailing slashes before query parameters are strictly required by TikTok's routers to avoid 404s)
        // We list multiple robust endpoints for redundancy.
        const tiktokEndpoints = [
          "https://api16-normal-v6.tiktokv.com/media/api/text/speech/invoke/?device_id=5555555555555555555&user_id=5555555555555555555&aid=1233",
          "https://api16-normal-useast5.us.tiktokv.com/media/api/text/speech/invoke/?device_id=5555555555555555555&user_id=5555555555555555555&aid=1233",
          "https://api16-normal-c-useast1a.tiktokv.com/media/api/text/speech/invoke/?device_id=5555555555555555555&user_id=5555555555555555555&aid=1233",
          "https://api16-normal-v4.amemv.com/media/api/text/speech/invoke/?device_id=5555555555555555555&user_id=5555555555555555555&aid=1233",
          "https://api16-normal-useast5.us.tiktokv.com/media/api/text/speech/?device_id=5555555555555555555&user_id=5555555555555555555&aid=1180",
          "https://api16-normal-c-useast1a.tiktokv.com/media/api/text/speech/?device_id=5555555555555555555&user_id=5555555555555555555&aid=1180"
        ];

        let tiktokSuccess = false;

        for (const tiktokUrl of tiktokEndpoints) {
          try {
            const host = tiktokUrl.split('/')[2];
            const isInvoke = tiktokUrl.includes('/invoke');
            console.log(`TTS TikTok: Trying endpoint ${host} (${isInvoke ? 'invoke' : 'classic'})...`);
            
            // Famous natural TikTok Thai speaker: th_001, fallback English: en_us_001
            const speaker = lang === "th" ? "th_001" : "en_us_001";
            
            // For invoke standard we prepare text spaces with "+" as required by some TikTok TTS sanitization steps
            const preparedText = text.replace(/\+/g, 'plus').replace(/\s/g, '+').replace(/&/g, 'and');
            
            const queryBody = new URLSearchParams();
            queryBody.append("text_speaker", speaker);
            queryBody.append("req_text", preparedText);
            queryBody.append("speaker_map_type", "0");
            queryBody.append("aid", "1233");

            const tiktokRes = await fetch(tiktokUrl, {
              method: "POST",
              headers: {
                "User-Agent": "com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)",
                "Cookie": `sessionid=${apiKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip,deflate,compress"
              },
              body: queryBody.toString()
            });

            if (tiktokRes.ok) {
              const data: any = await tiktokRes.json();
              const base64Audio = data && data.data && (data.data.v_audio || data.data.v_str);

              if (base64Audio) {
                console.log(`TTS TikTok success: Generated premium TikTok audio using ${host} for: "${text.substring(0, 20)}..."`);
                const buffer = Buffer.from(base64Audio, "base64");
                res.setHeader("Content-Type", "audio/mpeg");
                res.setHeader("Content-Length", buffer.length);
                res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
                res.send(buffer);
                tiktokSuccess = true;
                break;
              } else {
                console.log(`TikTok-TTS info: ${host} checked, cascading fallback...`);
              }
            } else {
              console.log(`TikTok-TTS info: ${host} responded, cascading fallback...`);
            }
          } catch (err: any) {
            console.log(`TikTok-TTS info: ${tiktokUrl.split('/')[2]} offline, skipping...`);
          }
        }

        if (tiktokSuccess) {
          return;
        } else {
          console.log("TikTok-TTS: Moving to standard Google translation voice engine.");
        }
      } else if ((clientEngine === "google_cloud_premium" || clientApiKey) && apiKey) {
        // Run Google Premium only if the key is formatted like Google API key (starts with AIzaSy)
        if (!apiKey.startsWith("AIzaSy")) {
          console.log(`TTS: Skipping Google Cloud Premium because key doesn't start with 'AIzaSy' (likely invalid or generic key). Cascading...`);
        } else {
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
              console.log(`Premium Google Cloud TTS returned non-OK status (${cloudRes.status}):`, errorText);
              // Don't crash, let it cascade down to free scrapers so the user's overlay remains operational!
            }
          } catch (cloudErr) {
            console.log("Premium Google TTS query was unsuccessful:", cloudErr);
          }
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
        console.log("Connection with translation service gtx had an issue:", err);
      }

      // Attempt 2: Backup Google Translate client=tw-ob endpoint (domain: translate.google.com)
      if (!response || !response.ok) {
        console.log(`TTS translate.googleapis.com/gtx completed with status ${response ? response.status : "connection problem"}. Attempting standard browser translator client...`);
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
          console.log("Standard browser translator client had an issue:", err);
        }
      }

      // Attempt 3: Bulletproof SoundOfText API Proxy fallback
      // Since SoundOfText is hosted externally, it is highly immune to local Cloud Run IP bans or Google captchas.
      if (!response || !response.ok) {
        console.log(`TTS browser translator completed with status ${response ? response.status : "connection problem"}. Utilizing SoundOfText API fallback...`);
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
