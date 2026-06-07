/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Gift, UserPlus, Share2, Shield, Star, Award, WifiOff, Volume2, Image, Sparkles, Camera, Crown } from 'lucide-react';
import { ChatMessage, AlertEvent, OverlaySettings, OverlayTheme } from '../types';
import { soundSynth } from '../utils/audio';
import VectorAvatar from './VectorAvatar';

interface OverlayViewProps {
  settingsOverride?: Partial<OverlaySettings>;
  isDemo?: boolean;
}

// Sparkle interface for the canvas particle bubble explosion
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

// Falling Heart interface inside the interactive glass
interface FallingHeart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;
  spin: number;
  opacity: number;
  settled: boolean;
  emoji: string;
  disappearing?: boolean;
}

// Highly optimized global cache block for emoji rendering on offscreen canvas to prevent browser rasterization bottleneck
const emojiCanvasCache: Record<string, HTMLCanvasElement> = {};
const getEmojiCanvas = (emoji: string, rawSize: number): HTMLCanvasElement => {
  const size = Math.round(rawSize);
  const key = `${emoji}_${size}`;
  if (emojiCanvasCache[key]) {
    return emojiCanvasCache[key];
  }
  const canvas = document.createElement('canvas');
  // Add padding margins so OS-rendered emoji glyphs do not get clipped at the borders
  const pad = 12;
  canvas.width = size + pad;
  canvas.height = size + pad;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
  }
  emojiCanvasCache[key] = canvas;
  return canvas;
};

export default function OverlayView({ settingsOverride, isDemo = false }: OverlayViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeAlert, setActiveAlert] = useState<AlertEvent | null>(null);
  const [imageShareAlert, setImageShareAlert] = useState<ChatMessage | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [audioLocked, setAudioLocked] = useState(true);

  const unlockAudio = () => {
    setAudioLocked(false);
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const silentUtterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(silentUtterance);
      }
      const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      silentAudio.play().catch(() => {});
    } catch (err) {
      console.warn("Speech Synthesis / Audio context unlock failed:", err);
    }
  };

  const wsRef = useRef<WebSocket | null>(null);
  const particleIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Global browser click or touch handler to transparently unlock speech/audio policies as a fallback
  useEffect(() => {
    const handleGlobalClick = () => {
      if (audioLocked) {
        unlockAudio();
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('touchstart', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [audioLocked]);

  // Parse settings from URL or override
  const settings = useMemo<OverlaySettings>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Fallback constants
    const defaultSettings: OverlaySettings = {
      wsUrl: 'ws://localhost:62024',
      theme: 'cyberpunk',
      fontSize: 16,
      maxMessages: 15,
      messageLifetime: 15,
      showAvatars: true,
      showBadges: true,
      alertSounds: true,
      textToSpeech: false,
      ttsVoiceRate: 1.0,
      ttsVoicePitch: 1.0,
      ttsEngine: 'browser',
      ttsReadChat: true,
      ttsReadGift: true,
      ttsReadFollow: true,
      ttsReadShareImage: true,
      ttsSkipNickname: false,
      highlightKeywords: ['obs', 'indofinity', 'stream', 'highlight'],
      ignoredUsers: [],
      animationStyle: 'slide-up',
      testChannelName: 'IndoFinity Streamer',
      showImageAlerts: true,
      mode: 'all',
      glassType: 'beer',
      vectorAvatarSpeed: 1.0,
      hideAvatarsWhenNoViewers: false,
      testViewerCount: 1,
      hideWhenIdle: true,
      idleTimeout: 60,
      spawnOnlyOnActivity: true,
      showWalkingAvatars: true,
      maxVisitorAvatars: 1,
      fontFamily: 'Prompt',
      showTimer: false,
      timerDuration: 300,
      timerPosition: 'top-left',
      timerOnlyNumbers: false,
      timerGlowColor: 'cyan',
      timerFontSize: 48
    };

    // Load from localStorage as a fail-safe fallback
    let savedSettings: Partial<OverlaySettings> = {};
    try {
      const saved = localStorage.getItem('obs_overlay_settings');
      if (saved) {
        savedSettings = JSON.parse(saved);
      }
    } catch (e) {
      // Ignore
    }

    // If we've got override parameters (from the Dashboard live-preview), use those
    if (settingsOverride) {
      return { ...defaultSettings, ...savedSettings, ...settingsOverride };
    }

    // Otherwise, parse query parameters for direct OBS overlay URL
    try {
      const parsed: OverlaySettings = {
        wsUrl: searchParams.get('wsUrl') || savedSettings.wsUrl || defaultSettings.wsUrl,
        theme: (searchParams.get('theme') as OverlayTheme) || savedSettings.theme || defaultSettings.theme,
        fontSize: Number(searchParams.get('fontSize')) || savedSettings.fontSize || defaultSettings.fontSize,
        maxMessages: Number(searchParams.get('maxMessages')) || savedSettings.maxMessages || defaultSettings.maxMessages,
        messageLifetime: searchParams.has('messageLifetime') ? Number(searchParams.get('messageLifetime')) : (savedSettings.messageLifetime !== undefined ? savedSettings.messageLifetime : defaultSettings.messageLifetime),
        showAvatars: searchParams.has('showAvatars') ? searchParams.get('showAvatars') !== 'false' : (savedSettings.showAvatars !== undefined ? savedSettings.showAvatars : true),
        showBadges: searchParams.has('showBadges') ? searchParams.get('showBadges') !== 'false' : (savedSettings.showBadges !== undefined ? savedSettings.showBadges : true),
        alertSounds: searchParams.has('alertSounds') ? searchParams.get('alertSounds') !== 'false' : (savedSettings.alertSounds !== undefined ? savedSettings.alertSounds : true),
        textToSpeech: searchParams.has('textToSpeech') ? searchParams.get('textToSpeech') === 'true' : (savedSettings.textToSpeech !== undefined ? savedSettings.textToSpeech : false),
        ttsVoiceRate: Number(searchParams.get('ttsVoiceRate')) || savedSettings.ttsVoiceRate || defaultSettings.ttsVoiceRate,
        ttsVoicePitch: Number(searchParams.get('ttsVoicePitch')) || savedSettings.ttsVoicePitch || defaultSettings.ttsVoicePitch,
        ttsVoiceName: searchParams.get('ttsVoiceName') || savedSettings.ttsVoiceName || undefined,
        ttsEngine: (searchParams.get('ttsEngine') as any) || savedSettings.ttsEngine || defaultSettings.ttsEngine,
        ttsReadChat: searchParams.has('ttsReadChat') ? searchParams.get('ttsReadChat') !== 'false' : (savedSettings.ttsReadChat !== undefined ? savedSettings.ttsReadChat : true),
        ttsReadGift: searchParams.has('ttsReadGift') ? searchParams.get('ttsReadGift') !== 'false' : (savedSettings.ttsReadGift !== undefined ? savedSettings.ttsReadGift : true),
        ttsReadFollow: searchParams.has('ttsReadFollow') ? searchParams.get('ttsReadFollow') !== 'false' : (savedSettings.ttsReadFollow !== undefined ? savedSettings.ttsReadFollow : true),
        ttsReadShareImage: searchParams.has('ttsReadShareImage') ? searchParams.get('ttsReadShareImage') !== 'false' : (savedSettings.ttsReadShareImage !== undefined ? savedSettings.ttsReadShareImage : true),
        ttsSkipNickname: searchParams.has('ttsSkipNickname') ? searchParams.get('ttsSkipNickname') === 'true' : (savedSettings.ttsSkipNickname !== undefined ? savedSettings.ttsSkipNickname : false),
        highlightKeywords: searchParams.get('highlightKeywords')?.split(',') || savedSettings.highlightKeywords || defaultSettings.highlightKeywords,
        ignoredUsers: searchParams.get('ignoredUsers')?.split(',') || savedSettings.ignoredUsers || defaultSettings.ignoredUsers,
        animationStyle: (searchParams.get('animationStyle') as any) || savedSettings.animationStyle || defaultSettings.animationStyle,
        testChannelName: savedSettings.testChannelName || defaultSettings.testChannelName,
        showImageAlerts: searchParams.has('showImageAlerts') ? searchParams.get('showImageAlerts') !== 'false' : (savedSettings.showImageAlerts !== undefined ? savedSettings.showImageAlerts : true),
        mode: (searchParams.get('mode') as any) || savedSettings.mode || 'all',
        glassType: (searchParams.get('glassType') as any) || savedSettings.glassType || defaultSettings.glassType || 'beer',
        customAvatars: savedSettings.customAvatars || defaultSettings.customAvatars,
        vectorAvatarSpeed: searchParams.has('vectorAvatarSpeed') ? Number(searchParams.get('vectorAvatarSpeed')) : (savedSettings.vectorAvatarSpeed !== undefined ? savedSettings.vectorAvatarSpeed : 1.0),
        hideAvatarsWhenNoViewers: searchParams.has('hideAvatarsWhenNoViewers') ? searchParams.get('hideAvatarsWhenNoViewers') === 'true' : (savedSettings.hideAvatarsWhenNoViewers !== undefined ? savedSettings.hideAvatarsWhenNoViewers : false),
        testViewerCount: searchParams.has('testViewerCount') ? Number(searchParams.get('testViewerCount')) : (savedSettings.testViewerCount !== undefined ? savedSettings.testViewerCount : 1),
        hideWhenIdle: searchParams.has('hideWhenIdle') ? searchParams.get('hideWhenIdle') === 'true' : (savedSettings.hideWhenIdle !== undefined ? savedSettings.hideWhenIdle : true),
        idleTimeout: searchParams.has('idleTimeout') ? Number(searchParams.get('idleTimeout')) : (savedSettings.idleTimeout !== undefined ? savedSettings.idleTimeout : 60),
        spawnOnlyOnActivity: searchParams.has('spawnOnlyOnActivity') ? searchParams.get('spawnOnlyOnActivity') === 'true' : (savedSettings.spawnOnlyOnActivity !== undefined ? savedSettings.spawnOnlyOnActivity : true),
        showWalkingAvatars: searchParams.has('showWalkingAvatars') ? searchParams.get('showWalkingAvatars') !== 'false' : (savedSettings.showWalkingAvatars !== false),
        maxVisitorAvatars: searchParams.has('maxVisitorAvatars') ? Number(searchParams.get('maxVisitorAvatars')) : (savedSettings.maxVisitorAvatars !== undefined ? savedSettings.maxVisitorAvatars : 1),
        fontFamily: searchParams.get('fontFamily') || savedSettings.fontFamily || defaultSettings.fontFamily,
        showTimer: searchParams.has('showTimer') ? searchParams.get('showTimer') === 'true' : (savedSettings.showTimer !== undefined ? savedSettings.showTimer : false),
        timerDuration: searchParams.has('timerDuration') ? Number(searchParams.get('timerDuration')) : (savedSettings.timerDuration !== undefined ? savedSettings.timerDuration : 300),
        timerPosition: (searchParams.get('timerPosition') as any) || savedSettings.timerPosition || 'top-left',
        timerOnlyNumbers: searchParams.has('timerOnlyNumbers') ? searchParams.get('timerOnlyNumbers') === 'true' : (savedSettings.timerOnlyNumbers !== undefined ? savedSettings.timerOnlyNumbers : false),
        timerGlowColor: (searchParams.get('timerGlowColor') as any) || savedSettings.timerGlowColor || 'cyan',
        timerFontSize: searchParams.has('timerFontSize') ? Number(searchParams.get('timerFontSize')) : (savedSettings.timerFontSize || 48)
      };
      return parsed;
    } catch {
      return { ...defaultSettings, ...savedSettings };
    }
  }, [settingsOverride, window.location.search]);

  const [timerLeft, setTimerLeft] = useState<number>(300);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // Keep track of master timer state from the server for smooth client-side interpolation
  const timerSyncRef = useRef<{
    serverSeconds: number;
    serverActive: boolean;
    localTimeOfFetch: number;
  }>({
    serverSeconds: 300,
    serverActive: false,
    localTimeOfFetch: Date.now(),
  });

  // Load custom selected font dynamically on the active OBS overlay view
  useEffect(() => {
    if (settings.fontFamily) {
      try {
        const linkId = 'custom-google-font-stylesheet';
        let linkElement = document.getElementById(linkId) as HTMLLinkElement;
        if (!linkElement) {
          linkElement = document.createElement('link');
          linkElement.id = linkId;
          linkElement.rel = 'stylesheet';
          document.head.appendChild(linkElement);
        }
        const fontName = settings.fontFamily.replace(/\s+/g, '+');
        linkElement.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700;800;900&display=swap`;
      } catch (err) {
        console.warn('Failed to load Google Font:', err);
      }
    }
  }, [settings.fontFamily]);

  // Realtime Countdown state listener & sync interval with Express server
  useEffect(() => {
    if (!settings.showTimer && settings.mode !== 'timer_only') return;

    let syncInterval: any;
    let tickInterval: any;

    const fetchTimerState = async () => {
      try {
        const res = await fetch('/api/timer');
        if (res.ok) {
          const data = await res.json();
          // Update the master sync reference with latest server readings
          timerSyncRef.current = {
            serverSeconds: data.secondsRemaining,
            serverActive: data.isActive,
            localTimeOfFetch: Date.now()
          };
          setTimerActive(data.isActive);
        }
      } catch (err) {
        console.warn('Failed to get timer state from server:', err);
      }
    };

    fetchTimerState();
    syncInterval = setInterval(fetchTimerState, 1500);

    // Keep counting down locally at 60fps (or very high frequency) for perfectly smooth visual output
    tickInterval = setInterval(() => {
      const { serverSeconds, serverActive, localTimeOfFetch } = timerSyncRef.current;
      if (serverActive) {
        const elapsedSinceFetch = (Date.now() - localTimeOfFetch) / 1000;
        const computedSeconds = Math.max(0, serverSeconds - elapsedSinceFetch);
        setTimerLeft(computedSeconds);
      } else {
        setTimerLeft(serverSeconds);
      }
    }, 50);

    return () => {
      clearInterval(syncInterval);
      clearInterval(tickInterval);
    };
  }, [settings.showTimer, settings.mode]);

  const fallingHeartsRef = useRef<FallingHeart[]>([]);
  const glassCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const prevWidthRef = useRef<number | null>(null);
  const prevHeightRef = useRef<number | null>(null);
  const prevTypeRef = useRef<string | null>(null);

  // Trigger hearts falling inside the glass with neck adjustments based on glassType
  const triggerFallingHearts = (count: number, customEmojis?: string[]) => {
    const newHearts: FallingHeart[] = [];
    const defaultEmojis = ['❤️', '💖', '💝', '💕', '💗', '💓', '💘'];
    const emojis = customEmojis || defaultEmojis;
    const colors = ['#ff4d6d', '#ff758f', '#ff8fa3', '#ffb3c1', '#ffccd5', '#ff99c8', '#fcf6bd'];
    const glassStartX = window.innerWidth / 2;
    const type = settings.glassType || 'beer';
    
    // Limits (high background check for extreme spam, allowing normal building up)
    const currentCount = fallingHeartsRef.current.length;
    if (currentCount > 800) {
      const disappearing = fallingHeartsRef.current.filter(h => h.disappearing);
      const active = fallingHeartsRef.current.filter(h => !h.disappearing);
      
      if (disappearing.length > 80) {
        // Keep only the 30 newest disappearing ones, and keep active ones
        fallingHeartsRef.current = [...active, ...disappearing.slice(disappearing.length - 30)];
      } else if (active.length > 500) {
        const settled = active.filter(h => h.settled);
        const falling = active.filter(h => !h.settled);
        // Keep settled hearts (the base pile) and the newest falling hearts
        fallingHeartsRef.current = [
          ...settled.slice(Math.max(0, settled.length - 300)),
          ...falling.slice(Math.max(0, falling.length - 200))
        ];
      }
    }

    for (let i = 0; i < count; i++) {
      const size = 18 + Math.random() * 14;
      
      // Determine neck spawn bounds for the specific glass type to ensure everything lands beautifully!
      let spawnRangeWidth = 60; // default for glass width of 240
      if (type === 'wish-jar') {
        spawnRangeWidth = 40; // narrow jar neck is 70px wide (-35 to +35)
      } else if (type === 'beer') {
        spawnRangeWidth = 100;
      } else if (type === 'wine') {
        spawnRangeWidth = 120;
      } else if (type === 'cocktail') {
        spawnRangeWidth = 160;
      }

      const spawnX = glassStartX - (spawnRangeWidth / 2) + Math.random() * spawnRangeWidth;

      newHearts.push({
        id: Math.random(),
        x: spawnX,
        y: -100 - (i * 24), // waterfall staggered effect
        vx: -1.2 + Math.random() * 2.4, // less wild initial sideways drift so they fall in cleanly
        vy: 2.5 + Math.random() * 3,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        spin: -0.06 + Math.random() * 0.12,
        opacity: 1,
        settled: false,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      });
    }
    
    fallingHeartsRef.current = [...fallingHeartsRef.current, ...newHearts];
  };

  const updateHeartsPhysics = (W: number, H: number) => {
    const type = settings.glassType || 'beer';

    // 1. Detect if type changed inside the physics frame. Dispersion effect instead of instant glitching!
    if (prevTypeRef.current !== null && prevTypeRef.current !== type) {
      fallingHeartsRef.current.forEach(h => {
        if (!h.disappearing) {
          h.disappearing = true;
          h.settled = false;
          h.vx = -2.5 + Math.random() * 5.0;
          h.vy = -4 - Math.random() * 4; // float up high immediately
          h.spin = -0.12 + Math.random() * 0.24;
        }
      });
    }
    prevTypeRef.current = type;

    // 2. Space adaptation during viewport resizing
    if (prevWidthRef.current !== null && prevHeightRef.current !== null) {
      const dw = W - prevWidthRef.current;
      const dh = H - prevHeightRef.current;
      if (dw !== 0 || dh !== 0) {
        const dx = dw / 2; // center moves by half width diff
        const dy = dh;     // bottom moves by height diff
        fallingHeartsRef.current.forEach(h => {
          h.x += dx;
          h.y += dy;
        });
      }
    }
    prevWidthRef.current = W;
    prevHeightRef.current = H;

    const hearts = fallingHeartsRef.current;
    if (hearts.length === 0) return;

    // Position the glass bottom near the lower section of the screen
    const glassCenterX = W / 2;
    const isSmallCanvas = H < 500;
    const scaleFactor = isSmallCanvas ? (H / 550) : 1;

    const glassBottomY = H - (85 * scaleFactor);
    const glassWidth = 240 * scaleFactor;
    const glassHeight = 310 * scaleFactor;
    const glassTopY = glassBottomY - glassHeight;

    // 1. Apply gravity, air resistance, and update position/rotation
    for (let i = 0; i < hearts.length; i++) {
      const h = hearts[i];
      if (h.disappearing) {
        h.opacity -= 0.03; // Smooth fade-out dispersion rate (~1 second)
        h.x += h.vx;
        h.y += h.vy;
        h.angle += h.spin;
        continue;
      }
      
      if (h.settled) continue; // Skip moving/updating settled hearts entirely!
      
      // Gravity and Drag
      h.vy += 0.35; // Sturdy gravity feel
      h.vx *= 0.94; // Higher air drag to settle them quickly and naturally
      h.vy *= 0.94;

      h.x += h.vx;
      h.y += h.vy;
      h.angle += h.spin;

      // Limit velocities to avoid visual jitter or physics explosions
      const speed = Math.sqrt(h.vx * h.vx + h.vy * h.vy);
      const maxVel = 8;
      if (speed > maxVel) {
        h.vx = (h.vx / speed) * maxVel;
        h.vy = (h.vy / speed) * maxVel;
      }

      // Dampen rotation as speed drops
      if (speed < 0.2) {
        h.spin *= 0.6;
      }
    }

    // 2. Circle-to-Circle collision resolving (Highly optimized & shake-free!)
    for (let i = 0; i < hearts.length; i++) {
      const h1 = hearts[i];
      if (h1.disappearing) continue;
      const r1 = h1.size / 2;

      for (let j = i + 1; j < hearts.length; j++) {
        const h2 = hearts[j];
        if (h2.disappearing) continue;
        
        // CRITICAL PERFORMANCE BOOST: Skip collision between two static settled hearts!
        if (h1.settled && h2.settled) continue;

        const r2 = h2.size / 2;
        const dx = h2.x - h1.x;
        const dy = h2.y - h1.y;
        const minDist = r1 + r2; // Stacking limit without any overlap

        // HIGH-SPEED BOUNDING BOX CHECK
        if (Math.abs(dx) >= minDist || Math.abs(dy) >= minDist) {
          continue;
        }

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          const overlap = minDist - dist;
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);

          // Resolve based on which components are moving
          if (!h1.settled && !h2.settled) {
            // Both are active: Push apart equally
            h1.x -= nx * overlap * 0.5;
            h1.y -= ny * overlap * 0.5;
            h2.x += nx * overlap * 0.5;
            h2.y += ny * overlap * 0.5;

            // Simple elastic bounce
            const rvx = h2.vx - h1.vx;
            const rvy = h2.vy - h1.vy;
            const velNormal = rvx * nx + rvy * ny;
            if (velNormal < 0) {
              const impulse = -1.1 * velNormal * 0.5;
              h1.vx -= nx * impulse;
              h1.vy -= ny * impulse;
              h2.vx += nx * impulse;
              h2.vy += ny * impulse;
            }

            // Lateral rolling behavior for rolling off one another rather than settling vertically
            const rollSpeed = 0.08;
            if (Math.abs(dx) < (r1 + r2) * 0.75) {
              const rollDirection = dx >= 0 ? 1 : -1;
              h1.vx -= rollDirection * rollSpeed;
              h2.vx += rollDirection * rollSpeed;
            }
          } 
          else if (h1.settled) {
            // h1 is stationary/settled, h2 is falling: push only h2
            h2.x += nx * overlap;
            
            // Inelastic relative velocity dampening (kills wiggling/shaking!)
            const rvx = -h2.vx;
            const rvy = -h2.vy;
            const velNormal = rvx * nx + rvy * ny;
            if (velNormal < 0) {
              h2.vx += nx * velNormal;
              h2.vy += ny * velNormal;
            }

            // Gently slide roll off a direct stacked position
            if (Math.abs(dx) < (r1 + r2) * 0.75) {
              const rollDirection = dx >= 0 ? 1 : -1;
              h2.vx += rollDirection * 0.05;
            }
          } 
          else if (h2.settled) {
            // h2 is stationary/settled, h1 is falling: push only h1
            h1.x -= nx * overlap;

            // Inelastic relative velocity dampening (kills wiggling/shaking!)
            const rvx = -h1.vx;
            const rvy = -h1.vy;
            const velNormal = rvx * nx + rvy * ny;
            if (velNormal < 0) {
              h1.vx += nx * velNormal;
              h1.vy += ny * velNormal;
            }

            // Gently slide roll off
            if (Math.abs(dx) < (r1 + r2) * 0.75) {
              const rollDirection = dx >= 0 ? 1 : -1;
              h1.vx -= rollDirection * 0.05;
            }
          }
        }
      }
    }

    // 3. Resolve Glass/Container boundaries for ALL active and settled hearts! (Prevents any overflowing!)
    for (let i = 0; i < hearts.length; i++) {
      const h = hearts[i];
      if (h.disappearing) continue;

      const radius = h.size / 2;

      // General screen boundary safety
      if (h.x < radius) {
        h.x = radius;
        if (!h.settled) h.vx = Math.abs(h.vx) * 0.3;
      } else if (h.x > W - radius) {
        h.x = W - radius;
        if (!h.settled) h.vx = -Math.abs(h.vx) * 0.3;
      }

      // Apply specialized Glass container walls and floors which are 100% inside-safe
      if (type === 'beaker') {
        const leftWall = glassCenterX - glassWidth / 2 + (18 * scaleFactor); 
        const rightWall = glassCenterX + glassWidth / 2 - (18 * scaleFactor);
        const floorY = glassBottomY - (12 * scaleFactor);
        
        // Match beaker rounded corners at bottom
        const distFromLeft = Math.max(0, h.x - leftWall);
        const distFromRight = Math.max(0, rightWall - h.x);
        let currentFloorY = floorY;
        if (distFromLeft < 20 * scaleFactor) {
          const ratio = ((20 * scaleFactor) - distFromLeft) / (20 * scaleFactor);
          currentFloorY -= ratio * (12 * scaleFactor);
        } else if (distFromRight < 20 * scaleFactor) {
          const ratio = ((20 * scaleFactor) - distFromRight) / (20 * scaleFactor);
          currentFloorY -= ratio * (12 * scaleFactor);
        }

        if (h.x - radius < leftWall) {
          h.x = leftWall + radius;
          if (!h.settled) h.vx = Math.abs(h.vx) * 0.25;
        } else if (h.x + radius > rightWall) {
          h.x = rightWall - radius;
          if (!h.settled) h.vx = -Math.abs(h.vx) * 0.25;
        }
        if (h.y + radius > currentFloorY) {
          h.y = currentFloorY - radius;
          if (!h.settled) {
            h.vy = -Math.abs(h.vy) * 0.08; // extremely low bounce to settle fluidly
            h.vx *= 0.7; // friction
          }
        }
      } 
      else if (type === 'beer') {
        const leftWall = glassCenterX - glassWidth / 2 + (28 * scaleFactor); 
        const rightWall = glassCenterX + glassWidth / 2 - (28 * scaleFactor);
        const floorY = glassBottomY - (24 * scaleFactor); 
        
        const distFromLeft = Math.max(0, h.x - leftWall);
        const distFromRight = Math.max(0, rightWall - h.x);
        let currentFloorY = floorY;
        if (distFromLeft < 25 * scaleFactor) {
          const ratio = ((25 * scaleFactor) - distFromLeft) / (25 * scaleFactor);
          currentFloorY -= ratio * (15 * scaleFactor);
        } else if (distFromRight < 25 * scaleFactor) {
          const ratio = ((25 * scaleFactor) - distFromRight) / (25 * scaleFactor);
          currentFloorY -= ratio * (15 * scaleFactor);
        }

        if (h.x - radius < leftWall) {
          h.x = leftWall + radius;
          if (!h.settled) h.vx = Math.abs(h.vx) * 0.25;
        } else if (h.x + radius > rightWall) {
          h.x = rightWall - radius;
          if (!h.settled) h.vx = -Math.abs(h.vx) * 0.25;
        }
        if (h.y + radius > currentFloorY) {
          h.y = currentFloorY - radius;
          if (!h.settled) {
            h.vy = -Math.abs(h.vy) * 0.08;
            h.vx *= 0.7;
          }
        }
      }
      else if (type === 'wine') {
        const bowlTopY = glassBottomY - (150 * scaleFactor);
        const bowlRadius = 100 * scaleFactor;
        const maxRadius = bowlRadius - (10 * scaleFactor); // extra padding to keep 100% inside stroke

        if (h.y >= bowlTopY) {
          const dx = h.x - glassCenterX;
          const dy = h.y - bowlTopY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const limitDist = maxRadius - radius;
          if (dist > limitDist) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            h.x = glassCenterX + nx * limitDist;
            h.y = bowlTopY + ny * limitDist;
            if (!h.settled) {
              const dot = h.vx * nx + h.vy * ny;
              if (dot > 0) {
                h.vx -= nx * dot * 1.1;
                h.vy -= ny * dot * 1.1;
              }
            }
          }
        } else {
          const leftWall = glassCenterX - (75 * scaleFactor);
          const rightWall = glassCenterX + (75 * scaleFactor);
          if (h.x - radius < leftWall) {
            h.x = leftWall + radius;
            if (!h.settled) h.vx = Math.abs(h.vx) * 0.25;
          } else if (h.x + radius > rightWall) {
            h.x = rightWall - radius;
            if (!h.settled) h.vx = -Math.abs(h.vx) * 0.25;
          }
        }
      }
      else if (type === 'cocktail') {
        const bowlTopY = glassTopY + (30 * scaleFactor);
        const bowlBottomY = glassBottomY - (130 * scaleFactor);
        const padding = 12 * scaleFactor; // safety margin inside the glass
        
        if (h.y >= bowlTopY && h.y <= bowlBottomY + (15 * scaleFactor)) {
          const ratio = (bowlBottomY - h.y) / (bowlBottomY - bowlTopY);
          const clampedRatio = Math.max(0, Math.min(1, ratio));
          const currentHalfWidth = (12 * scaleFactor) + clampedRatio * (glassWidth / 2 - padding - (12 * scaleFactor));
          
          const currentLeft = glassCenterX - currentHalfWidth;
          const currentRight = glassCenterX + currentHalfWidth;
          
          if (h.x - radius < currentLeft) {
            h.x = currentLeft + radius;
            if (!h.settled) h.vx = Math.abs(h.vx) * 0.25 + 0.2; // Slide inward down the slope
          } else if (h.x + radius > currentRight) {
            h.x = currentRight - radius;
            if (!h.settled) h.vx = -Math.abs(h.vx) * 0.25 - 0.2;
          }
        }
        
        const funnelBaseY = bowlBottomY - (10 * scaleFactor);
        if (h.y + radius >= funnelBaseY) {
          h.y = funnelBaseY - radius;
          if (!h.settled) {
            h.vy = -Math.abs(h.vy) * 0.08;
            h.vx *= 0.7;
          }
        }
      }
      else if (type === 'wish-jar') {
        const jarCenterY = glassBottomY - (110 * scaleFactor);
        const jarRadius = 110 * scaleFactor;
        const maxRadius = jarRadius - (12 * scaleFactor); // keep safely inside the jar outline

        if (h.y >= jarCenterY - (95 * scaleFactor)) {
          const dx = h.x - glassCenterX;
          const dy = h.y - jarCenterY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const limitDist = maxRadius - radius;
          if (dist > limitDist) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            h.x = glassCenterX + nx * limitDist;
            h.y = jarCenterY + ny * limitDist;
            if (!h.settled) {
              const dot = h.vx * nx + h.vy * ny;
              if (dot > 0) {
                h.vx -= nx * dot * 1.1;
                h.vy -= ny * dot * 1.1;
              }
            }
          }
        } else {
          const neckLeft = glassCenterX - (27 * scaleFactor);
          const neckRight = glassCenterX + (27 * scaleFactor);
          if (h.x - radius < neckLeft) {
            h.x = neckLeft + radius;
            if (!h.settled) h.vx = Math.abs(h.vx) * 0.25;
          } else if (h.x + radius > neckRight) {
            h.x = neckRight - radius;
            if (!h.settled) h.vx = -Math.abs(h.vx) * 0.25;
          }
        }
      }
    }

    // 4. Settle down check: settle hearts that have come to a stop inside the glass container! (Checked after all position corrections)
    for (let i = 0; i < hearts.length; i++) {
      const h = hearts[i];
      if (h.settled || h.disappearing) continue;

      const speed = Math.sqrt(h.vx * h.vx + h.vy * h.vy);
      // Clean, low-vibration speed threshold
      if (speed < 0.28 && h.y > glassTopY + (30 * scaleFactor)) {
        h.settled = true;
        h.vx = 0;
        h.vy = 0;
        h.spin = 0;
      }
    }

    // 5. Check if glass is full and trigger dynamic dissolution/reset
    const nonDisappearingHearts = hearts.filter(h => !h.disappearing);
    const settledNonDisappearing = nonDisappearingHearts.filter(h => h.settled);
    
    // Determine height thresholds based on glassType
    let limitY = glassTopY + (50 * scaleFactor); 
    if (type === 'wine') {
      limitY = glassBottomY - (145 * scaleFactor); // wine glass bowl top rim level
    } else if (type === 'cocktail') {
      limitY = glassTopY + (70 * scaleFactor); // cocktail shallow bowl rim level
    } else if (type === 'wish-jar') {
      limitY = glassTopY + (50 * scaleFactor); // jar rim level
    }

    // A heart is considered "piled up" if it's below the rim but above limitY, and has slowed down vertically
    const piledUpHearts = nonDisappearingHearts.filter(h => h.y <= limitY && h.y > glassTopY + (5 * scaleFactor) && h.vy < 1.2);
    const hasSettledFull = settledNonDisappearing.length > 0 && Math.min(...settledNonDisappearing.map(h => h.y)) <= limitY;

    if (piledUpHearts.length >= 2 || hasSettledFull) {
      // GLASS IS FULL! Convert all non-disappearing hearts in the glass to floating disappearing ones!
      hearts.forEach(h => {
        if (!h.disappearing) {
          h.disappearing = true;
          h.settled = false;
          // Float upwards elegantly
          h.vx = -1.5 + Math.random() * 3.0;
          h.vy = -3 - Math.random() * 3; // soft upward floating wind
          h.spin = -0.08 + Math.random() * 0.16;
        }
      });
    }

    // 6. Filter out fully transparent hearts or those that have drifted away completely
    fallingHeartsRef.current = hearts.filter(h => h.opacity > 0 && h.y > -200 && h.y < H + 100);
  };

  const drawGlassAndHearts = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const hearts = fallingHeartsRef.current;
    
    // 1. Draw Hearts (Utilizing the highly optimized offscreen canvas cache to prevent lag!)
    hearts.forEach(h => {
      ctx.save();
      
      let drawX = h.x;
      let drawY = h.y;
      let drawAngle = h.angle;
      
      // If hearts are settled inside the glass, give them an incredibly smooth, living breathing breathing/swaying effect!
      if (h.settled && !h.disappearing) {
        // Unique phase per heart based on its ID so they wiggle naturally rather than as a single chunk
        const time = Date.now() * 0.0012; // slow organic frequency
        const phase = h.id * 100;
        
        const offsetX = Math.sin(time + phase) * 1.2; // delicate sway sideways
        const offsetY = Math.cos(time * 0.75 + phase) * 0.8; // subtle bobbing up and down
        const offsetAngle = Math.sin(time * 0.4 + phase) * 0.05; // tiny gentle twisting
        
        drawX += offsetX;
        drawY += offsetY;
        drawAngle += offsetAngle;
      }

      ctx.translate(drawX, drawY);
      ctx.rotate(drawAngle);
      ctx.globalAlpha = h.opacity;
      
      const emojiCanvas = getEmojiCanvas(h.emoji, h.size);
      ctx.drawImage(emojiCanvas, -emojiCanvas.width / 2, -emojiCanvas.height / 2);
      
      ctx.restore();
    });

    // 2. Draw Glass Border
    const glassCenterX = W / 2;
    const isSmallCanvas = H < 500;
    const scaleFactor = isSmallCanvas ? (H / 550) : 1;

    const glassBottomY = H - (85 * scaleFactor);
    const glassWidth = 240 * scaleFactor;
    const glassHeight = 310 * scaleFactor;
    const glassTopY = glassBottomY - glassHeight;
    const type = settings.glassType || 'beer';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let glowColor = '#00f3ff'; // default ice cyan
    if (type === 'wine') glowColor = '#da2a7a';
    else if (type === 'beer') glowColor = '#fbbf24';
    else if (type === 'cocktail') glowColor = '#ec4899';
    else if (type === 'wish-jar') glowColor = '#a855f7';
    
    // Draw Glass Inner liquid/glow back reflection
    ctx.beginPath();
    ctx.arc(glassCenterX, glassBottomY - (100 * scaleFactor), 60 * scaleFactor, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.fill();

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20 * scaleFactor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, 6 * scaleFactor);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';

    if (type === 'beaker') {
      ctx.beginPath();
      ctx.moveTo(glassCenterX - glassWidth / 2 - (10 * scaleFactor), glassTopY);
      ctx.lineTo(glassCenterX - glassWidth / 2 + (10 * scaleFactor), glassTopY);
      ctx.lineTo(glassCenterX - glassWidth / 2 + (10 * scaleFactor), glassBottomY - (15 * scaleFactor));
      ctx.quadraticCurveTo(glassCenterX - glassWidth / 2 + (10 * scaleFactor), glassBottomY, glassCenterX - glassWidth / 2 + (25 * scaleFactor), glassBottomY);
      ctx.lineTo(glassCenterX + glassWidth / 2 - (25 * scaleFactor), glassBottomY);
      ctx.quadraticCurveTo(glassCenterX + glassWidth / 2 + (10 * scaleFactor), glassBottomY, glassCenterX + glassWidth / 2 + (10 * scaleFactor), glassBottomY - (15 * scaleFactor));
      ctx.lineTo(glassCenterX + glassWidth / 2 + (10 * scaleFactor), glassTopY);
      ctx.lineTo(glassCenterX + glassWidth / 2 - (10 * scaleFactor), glassTopY);
      ctx.stroke();
      ctx.fill();
    }
    else if (type === 'beer') {
      ctx.beginPath();
      ctx.moveTo(glassCenterX - glassWidth / 2 + (15 * scaleFactor), glassTopY);
      ctx.lineTo(glassCenterX - glassWidth / 2 + (15 * scaleFactor), glassBottomY - (20 * scaleFactor));
      ctx.lineTo(glassCenterX - glassWidth / 2 + (25 * scaleFactor), glassBottomY - (5 * scaleFactor));
      ctx.lineTo(glassCenterX + glassWidth / 2 - (25 * scaleFactor), glassBottomY - (5 * scaleFactor));
      ctx.lineTo(glassCenterX + glassWidth / 2 - (15 * scaleFactor), glassBottomY - (20 * scaleFactor));
      ctx.lineTo(glassCenterX + glassWidth / 2 - (15 * scaleFactor), glassTopY);
      ctx.stroke();
      ctx.fill();

      // Big sturdy handle
      ctx.beginPath();
      ctx.arc(glassCenterX + glassWidth / 2 - (10 * scaleFactor), glassTopY + glassHeight / 2, 45 * scaleFactor, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = Math.max(6, 12 * scaleFactor);
      ctx.stroke();
      ctx.lineWidth = Math.max(2, 5 * scaleFactor);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
    else if (type === 'wine') {
      const bowlTopY = glassBottomY - (150 * scaleFactor);
      const bowlRadius = 100 * scaleFactor;
      const stemBottomY = glassBottomY;

      // Draw bowl Semicircle
      ctx.beginPath();
      ctx.moveTo(glassCenterX - (85 * scaleFactor), bowlTopY - (40 * scaleFactor));
      ctx.lineTo(glassCenterX - (85 * scaleFactor), bowlTopY);
      ctx.arc(glassCenterX, bowlTopY, bowlRadius, Math.PI, 0, true);
      ctx.lineTo(glassCenterX + (85 * scaleFactor), bowlTopY - (40 * scaleFactor));
      ctx.stroke();
      ctx.fill();

      // Draw stem
      ctx.beginPath();
      ctx.moveTo(glassCenterX, bowlTopY + bowlRadius);
      ctx.lineTo(glassCenterX, stemBottomY);
      ctx.lineWidth = Math.max(4, 8 * scaleFactor);
      ctx.stroke();

      // Draw Base
      ctx.beginPath();
      ctx.moveTo(glassCenterX - (65 * scaleFactor), stemBottomY);
      ctx.lineTo(glassCenterX + (65 * scaleFactor), stemBottomY);
      ctx.lineWidth = Math.max(3, 6 * scaleFactor);
      ctx.stroke();
    }
    else if (type === 'cocktail') {
      const bowlTopY = glassTopY + (30 * scaleFactor);
      const bowlBottomY = glassBottomY - (130 * scaleFactor);

      // Triangular cup list
      ctx.beginPath();
      ctx.moveTo(glassCenterX - glassWidth / 2, bowlTopY);
      ctx.lineTo(glassCenterX, bowlBottomY);
      ctx.lineTo(glassCenterX + glassWidth / 2, bowlTopY);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Stem
      ctx.beginPath();
      ctx.moveTo(glassCenterX, bowlBottomY);
      ctx.lineTo(glassCenterX, glassBottomY);
      ctx.lineWidth = Math.max(3, 6 * scaleFactor);
      ctx.stroke();

      // Base
      ctx.beginPath();
      ctx.moveTo(glassCenterX - (55 * scaleFactor), glassBottomY);
      ctx.lineTo(glassCenterX + (55 * scaleFactor), glassBottomY);
      ctx.stroke();
    }
    else if (type === 'wish-jar') {
      const jarCenterY = glassBottomY - (110 * scaleFactor);
      const jarRadius = 110 * scaleFactor;

      ctx.beginPath();
      // Left Neck
      ctx.moveTo(glassCenterX - (45 * scaleFactor), glassTopY);
      ctx.lineTo(glassCenterX - (40 * scaleFactor), jarCenterY - (100 * scaleFactor));
      // Bulb
      ctx.arc(glassCenterX, jarCenterY, jarRadius, -Math.PI / 2.3, Math.PI + Math.PI / 2.3, false);
      // Right Neck
      ctx.lineTo(glassCenterX + (40 * scaleFactor), jarCenterY - (100 * scaleFactor));
      ctx.lineTo(glassCenterX + (45 * scaleFactor), glassTopY);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Collar rim
      ctx.beginPath();
      ctx.moveTo(glassCenterX - (55 * scaleFactor), glassTopY);
      ctx.lineTo(glassCenterX + (55 * scaleFactor), glassTopY);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Run loop for Falling Hearts interactive canvas
  useEffect(() => {
    let active = true;
    let frameId: number;

    const tick = () => {
      if (!active) return;
      const canvas = glassCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const rect = canvas.getBoundingClientRect();
          const targetW = rect.width || window.innerWidth;
          const targetH = rect.height || window.innerHeight;
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          updateHeartsPhysics(canvas.width, canvas.height);
          drawGlassAndHearts(ctx, canvas);
        }
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [settings.glassType, settings.mode]);

  // Custom User colors mapping to keep username colors consistent in chat overlays
  const settingsRef = useRef<OverlaySettings>(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const getStageWidth = () => {
    return window.innerWidth;
  };

  const getStageHeight = () => {
    return window.innerHeight;
  };

  const userColorsMap = useRef<Record<string, string>>({});
  const recentEventsRef = useRef<Map<string, number>>(new Map());
  const getUserColor = (username: string) => {
    if (userColorsMap.current[username]) return userColorsMap.current[username];
    // Vibrant colors suitable for transparent streaming backgrounds
    const streamFriendlyColors = [
      '#FF3366', // Hot pink
      '#00FFCC', // Cyan/Mint
      '#FFCC00', // Yellow
      '#33CCFF', // Blue
      '#FF66CC', // Light pink
      '#99FF33', // Neon Lime
      '#FF9933', // Neon Orange
      '#CC66FF', // Lavendar
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = streamFriendlyColors[Math.abs(hash) % streamFriendlyColors.length];
    userColorsMap.current[username] = color;
    return color;
  };

  // Active avatars walking around
  interface StreamAvatar {
    id: string;
    uniqueId: string;
    nickname: string;
    x: number; // percentage (0 to 100)
    y: number; // height offset (vertical jump, pixels)
    vx: number; // horizontal velocity
    vy: number; // vertical velocity (jump physics)
    facing: 'left' | 'right';
    isJumping: boolean;
    spriteUrl: string;
    scale: number;
    bubbleText: string;
    bubbleTime: number; // expiration timestamp
    lastActive?: number; // last interaction/speech timestamp
  }
  const [avatars, setAvatars] = useState<StreamAvatar[]>([]);
  const [activeViewers, setActiveViewers] = useState<number>(() => {
    return settings.testViewerCount !== undefined ? settings.testViewerCount : 1;
  });

  const [lastActivity, setLastActivity] = useState<number>(0);
  const [isIdle, setIsIdle] = useState<boolean>(true);

  useEffect(() => {
    if (!settings.hideWhenIdle) {
      setIsIdle(false);
      return;
    }
    const checkIdle = () => {
      const unusedTime = Date.now() - lastActivity;
      const timeoutMs = (settings.idleTimeout ?? 60) * 1000;
      setIsIdle(unusedTime >= timeoutMs);
    };
    checkIdle();
    const interval = setInterval(checkIdle, 1000);
    return () => clearInterval(interval);
  }, [lastActivity, settings.hideWhenIdle, settings.idleTimeout]);

  useEffect(() => {
    if (settings.testViewerCount !== undefined) {
      setActiveViewers(settings.testViewerCount);
    }
  }, [settings.testViewerCount]);

  const getAvatarPool = () => {
    if (settings.customAvatars && settings.customAvatars.length > 0) {
      return settings.customAvatars;
    }
    // If empty, return standard defaults
    return [
      { id: '1', name: 'สไลม์เจลลี่ดึ๋งดั๋ง', spriteUrl: 'vector:slime', scale: 1.15 },
      { id: '2', name: 'หุ่นยนต์ไซเบอร์บอท', spriteUrl: 'vector:robot', scale: 1.15 },
      { id: '3', name: 'นินจาเงาวายุสะกดชีพ', spriteUrl: 'vector:ninja', scale: 1.15 },
      { id: '4', name: 'ลูกแมวเหมียวสามสี', spriteUrl: 'vector:kitten', scale: 1.15 }
    ];
  };

  useEffect(() => {
    if (settings.showWalkingAvatars === false) {
      setAvatars([]);
      return;
    }
    const pool = getAvatarPool();
    setAvatars(prev => {
      if (settings.spawnOnlyOnActivity) {
        // Sync scale/spriteUrl of existing avatars if changed in settings pool, rather than spawning the entire pool by default
        return prev.map(av => {
          const matchingPoolItem = pool.find(item => item.id === av.id || (av.uniqueId && av.uniqueId.toLowerCase().includes(item.name.toLowerCase().replace(/\s+/g, '_'))));
          if (matchingPoolItem) {
            return {
              ...av,
              spriteUrl: matchingPoolItem.spriteUrl,
              scale: matchingPoolItem.scale || 1.15
            };
          }
          return av;
        });
      } else {
        // Map pool items into walking avatars automatically (classic behavior)
        const configuredAvatars = pool.map((item, index) => {
          const existing = prev.find(av => av.id === item.id);
          if (existing) {
            // Keep existing physics status but sync latest sprite scale/url
            return {
              ...existing,
              spriteUrl: item.spriteUrl,
              scale: item.scale || 1.15
            };
          }
          
          // Spawn brand new avatar with a cute leap
          const rSpeedIndex = Math.random() > 0.5 ? 1 : -1;
          const defaultPositions = [15, 32, 48, 65, 80, 92];
          const posX = defaultPositions[index % defaultPositions.length] + (Math.random() * 8 - 4);
          
          return {
            id: item.id,
            uniqueId: (item.name || 'avatar').toLowerCase().replace(/\s+/g, '_') + '_' + item.id,
            nickname: item.name.includes('(') ? item.name.split('(')[0].trim() : item.name,
            x: Math.max(4, Math.min(96, posX)),
            y: 0,
            vx: (Math.random() * 0.08 + 0.07) * rSpeedIndex,
            vy: -6 - Math.random() * 4, // cute spawn leap!
            facing: rSpeedIndex > 0 ? 'right' as const : 'left' as const,
            isJumping: true,
            spriteUrl: item.spriteUrl,
            scale: item.scale || 1.15,
            bubbleText: index === 0 ? 'สวัสดีค้าบ ยินดีต้อนรับสู่แชทอวตารดึ๋งดั๋ง 💕' : '',
            bubbleTime: index === 0 ? Date.now() + 6000 : 0
          };
        });

        const viewerAvatars = prev.filter(av => av.id.startsWith('chatter_') || av.id.startsWith('bot_') || !pool.some(p => p.id === av.id));
        return [...configuredAvatars, ...viewerAvatars.slice(0, 15)];
      }
    });
  }, [settings.customAvatars, settings.spawnOnlyOnActivity, settings.showWalkingAvatars]);

  useEffect(() => {
    let active = true;
    const updatePhysics = () => {
      if (!active) return;
      setAvatars(prev => {
        // 1. Calculate next positions for all avatars individually first
        const nextAvatars = prev.map(av => {
          // Horizontal movement
          let speedMult = 1.0;
          if (av.spriteUrl.startsWith('vector:') && settingsRef.current.vectorAvatarSpeed !== undefined) {
            speedMult = settingsRef.current.vectorAvatarSpeed;
          }
          let nextX = av.x + (av.vx * speedMult);
          let nextVx = av.vx;
          let nextFacing = av.facing;

          // Hit horizontal boundaries (0% to 100% of screenspace)
          if (nextX < 2) {
            nextX = 2;
            nextVx = Math.abs(av.vx);
            nextFacing = 'right';
          } else if (nextX > 94) {
            nextX = 94;
            nextVx = -Math.abs(av.vx);
            nextFacing = 'left';
          }

          // Occasional turn around
          if (Math.random() < 0.005) {
            nextVx = -nextVx;
            nextFacing = nextVx > 0 ? 'right' : 'left';
          }

          // Vertical Jump updates (vertical clearance bottom floor)
          let nextY = av.y + av.vy;
          let nextVy = av.vy;
          let nextIsJumping = av.isJumping;

          if (nextIsJumping) {
            nextVy += 0.5; // gravity acceleration
            if (nextY <= 0) {
              nextY = 0;
              nextVy = 0;
              nextIsJumping = false;
            }
          } else {
            // Occasional random jump
            if (Math.random() < 0.008) {
              nextVy = -8 - Math.random() * 5; // jump upwards
              nextIsJumping = true;
            }
          }

          return {
            ...av,
            x: nextX,
            vx: nextVx,
            facing: nextFacing,
            y: nextY,
            vy: nextVy,
            isJumping: nextIsJumping
          };
        });

        // 2. Resolve horizontal collisions so avatars walk past each other instead of merging/cluttering
        const colRadius = 8.0; // overlap threshold in percentage width (8% of width)
        for (let i = 0; i < nextAvatars.length; i++) {
          for (let j = i + 1; j < nextAvatars.length; j++) {
            const av1 = nextAvatars[i];
            const av2 = nextAvatars[j];

            // Only collides if they are both on or near the ground (y coordinate is relatively low)
            const yDiff = Math.abs(av1.y - av2.y);
            if (yDiff < 20) {
              const xDiff = av2.x - av1.x; // Positive if av2 is right of av1
              const dist = Math.abs(xDiff);
              if (dist < colRadius) {
                // Determine collision push adjustment
                const overlap = colRadius - dist;
                const push = overlap / 2;

                if (xDiff > 0) {
                  // av2 is to the right of av1, so push them apart!
                  av1.x = Math.max(2, av1.x - push);
                  av2.x = Math.min(94, av2.x + push);

                  // Swap velocities to make them walk in opposite directions
                  if (av1.vx > 0) {
                    av1.vx = -Math.abs(av1.vx);
                    av1.facing = 'left';
                  }
                  if (av2.vx < 0) {
                    av2.vx = Math.abs(av2.vx);
                    av2.facing = 'right';
                  }
                } else {
                  // av1 is to the right of av2, so push them apart!
                  av1.x = Math.min(94, av1.x + push);
                  av2.x = Math.max(2, av2.x - push);

                  if (av1.vx < 0) {
                    av1.vx = Math.abs(av1.vx);
                    av1.facing = 'right';
                  }
                  if (av2.vx > 0) {
                    av2.vx = -Math.abs(av2.vx);
                    av2.facing = 'left';
                  }
                }
              }
            }
          }
        }

        return nextAvatars;
      });
      requestAnimationFrame(updatePhysics);
    };

    const frameId = requestAnimationFrame(updatePhysics);
    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Sound triggering helper
  const triggerSound = (type: 'chat' | 'alert' | 'gift' | 'image') => {
    if (!settings.alertSounds) return;
    if (type === 'chat') {
      soundSynth.playPop();
    } else if (type === 'gift') {
      soundSynth.playGiftCoin();
    } else if (type === 'image') {
      soundSynth.playPhotoFlash();
    } else {
      soundSynth.playAlertChime();
    }
  };

  // Text to speech engine
  // Pre-process and sanitize text for perfect Thai pronunciation & bypass robotic spelling of usernames
  const prepareTTSMsg = (type: 'chat' | 'gift' | 'follow' | 'share_image', nickname: string, mainContent: string) => {
    // 1. Clean main content (e.g., chat message or gift name) from emojis & non-pronounceable symbols
    // It is important to leave letters, numbers, spaces, and basic punctuation but strip visual emoji slop
    let cleanComment = mainContent
      .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u200B-\u200D\uFE0F]|[\u2600-\u27BF]|[\uE000-\uF8FF]/g, '') // Safe surrogate-pairs and emoji/symbol stripping
      .replace(/[~`@#$%^&*()_\-+={[}\]|\\:;"'<,>?\/]/g, ' ') // Replace punctuation causing synthesizer audio glitch with space
      .trim();

    // 2. Process nickname
    let cleanNickname = nickname.trim();
    if (settings.ttsSkipNickname) {
      cleanNickname = '';
    } else {
      // Clean nickname from emojis/symbols too
      cleanNickname = cleanNickname
        .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u200B-\u200D\uFE0F]|[\u2600-\u27BF]|[\uE000-\uF8FF]/g, '')
        .trim();

      const hasThaiName = /[\u0E00-\u0E7F]/.test(cleanNickname);
      if (!hasThaiName) {
        // Pure English (or English+数字) nicknames like "Somsak123", "User_999" are extremely
        // annoying to read character by character in Thai. Translating them to friendly "คุณ" (Khun/You)
        // makes the streams extremely natural, clean, and fluid!
        cleanNickname = "คุณ";
      }
    }

    // 3. Construct final spoken text based on event type
    let finalSpokenText = '';
    if (type === 'chat') {
      if (!cleanComment) return { text: '', isThai: true };
      finalSpokenText = cleanNickname ? `${cleanNickname}กล่าวว่า ${cleanComment}` : cleanComment;
    } else if (type === 'gift') {
      finalSpokenText = cleanNickname ? `${cleanNickname} ส่งของขวัญ ${cleanComment}!` : `ส่งของขวัญ ${cleanComment}!`;
    } else if (type === 'follow') {
      finalSpokenText = cleanNickname ? `${cleanNickname} ได้กดติดตามช่องแล้ว!` : `มีผู้ติดตามคนใหม่แล้ว!`;
    } else if (type === 'share_image') {
      finalSpokenText = cleanNickname ? `${cleanNickname} ได้ส่งรูปภาพ และบอกว่า ${cleanComment}` : `ส่งรูปภาพ ${cleanComment}`;
    }

    // 4. Identify if it contains Thai characters to select voice localized domain later
    // Test the final constructed spoken text so that preambles like 'คุณกล่าวว่า' or the Thai texts are correctly identified.
    const isThai = /[\u0E00-\u0E7F]/.test(finalSpokenText || cleanComment || nickname);

    return { text: finalSpokenText.trim(), isThai };
  };

  const triggerTTS = (text: string, isThaiOverride?: boolean) => {
    if (!settings.textToSpeech || !text) return;
    try {
      const isThai = isThaiOverride !== undefined ? isThaiOverride : /[\u0E00-\u0E7F]/.test(text);
      const voices = window.speechSynthesis.getVoices();
      const hasThaiVoice = voices.some(v => v.lang.toLowerCase().startsWith('th') || v.lang.toLowerCase().includes('th-'));

      // Dual system: Force Google Translate TTS for Thai texts since browser Thai voices are often broken, robotic or non-existent in OBS/PCs
      const useGoogle = settings.ttsEngine === 'google' || isThai || !hasThaiVoice;

      if (useGoogle) {
        const langCode = isThai ? 'th' : 'en';
        // Try stable googleapis API endpoint first client-side
        const clientSideUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${langCode}&client=gtx&q=${encodeURIComponent(text)}`;
        
        // Dynamically create audio element and set referrerpolicy="no-referrer" to strip the Referer header
        // This makes Google see it as a direct client request and bypasses the 403 Forbidden/CORS blocks
        const audio = document.createElement('audio');
        audio.setAttribute('referrerpolicy', 'no-referrer');
        audio.src = clientSideUrl;
        audio.playbackRate = settings.ttsVoiceRate || 1.0;
        
        audio.play()
          .then(() => {
            console.log('Successfully played client-side Google Translation TTS stream');
          })
          .catch(err => {
            console.warn('Client-side Google TTS failed (possibly blocked/autoplay-limit), falling back to Server TTS proxy:', err);
            // 2. Fallback to Server Proxy
            const serverSideUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`;
            const fallbackAudio = document.createElement('audio');
            fallbackAudio.setAttribute('referrerpolicy', 'no-referrer');
            fallbackAudio.src = serverSideUrl;
            fallbackAudio.playbackRate = settings.ttsVoiceRate || 1.0;
            fallbackAudio.play()
              .then(() => {
                console.log('Successfully played server-side Google TTS proxy');
              })
              .catch(proxyErr => {
                console.warn('Server-side Google TTS proxy also failed, falling back to Browser Web Speech synthesis:', proxyErr);
                // 3. Fallback to Native Speech Synthesis
                speakBrowserTTS(text, isThai, voices);
              });
          });
      } else {
        speakBrowserTTS(text, isThai, voices);
      }
    } catch (e) {
      console.warn('TTS vocalisation failed:', e);
    }
  };

  const speakBrowserTTS = (text: string, isThai: boolean, voices: SpeechSynthesisVoice[]) => {
    try {
      window.speechSynthesis.cancel(); // Cancel active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.ttsVoiceRate || 1.0;
      utterance.pitch = settings.ttsVoicePitch || 1.0;
      utterance.lang = isThai ? 'th-TH' : 'en-US';

      if (voices.length > 0) {
        let selectedVoice: SpeechSynthesisVoice | undefined = undefined;
        if (settings.ttsVoiceName) {
          selectedVoice = voices.find(v => v.name === settings.ttsVoiceName);
        }
        if (!selectedVoice) {
          selectedVoice = voices.find(v => {
            const langLower = v.lang.toLowerCase();
            return isThai ? (langLower.startsWith('th') || langLower.includes('th-')) : (langLower.startsWith('en') || langLower.includes('en-'));
          });
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          // If no matching voice is found, we keep utterance.lang as 'th-TH' so the host system can try to load its default Thai package.
          // NEVER fallback to English/indonesian voice for Thai text.
          utterance.lang = isThai ? 'th-TH' : 'en-US';
        }
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('speakBrowserTTS error:', err);
    }
  };

  // Sparkle Burst Particle Generator
  const generateSparkleBurst = (x: number, y: number, theme: OverlayTheme) => {
    const newParticles: Particle[] = [];
    const colors = theme === 'cyberpunk' 
      ? ['#FF007F', '#00F0FF', '#FFF', '#9900FF'] 
      : theme === 'retro' 
        ? ['#00FF00', '#FFFF00', '#FF00FF', '#00FFFF']
        : theme === 'cosmic-nebula'
          ? ['#8B5CF6', '#06B6D4', '#EC4899', '#FFFFFF']
          : theme === 'futuristic-holo'
            ? ['#00f3ff', '#38bdf8', '#0284c7', '#ffffff']
            : theme === 'luxury-obsidian'
              ? ['#fbbf24', '#f59e0b', '#d97706', '#3f3f46']
              : theme === 'vintage-journal'
                ? ['#c54b3c', '#8c7460', '#4a3b32', '#fbf5e6']
                : ['#FFB6C1', '#FFF', '#D8BFD8', '#E6E6FA']; // Pastel sakura

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      const id = particleIdRef.current++;
      
      newParticles.push({
        id,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // General upward drift
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 6,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.012
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Drive the Particle Canvas animation
  useEffect(() => {
    const updateParticles = () => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // Gravity pull
            alpha: p.alpha - p.decay
          }))
          .filter(p => p.alpha > 0)
      );
      animationFrameRef.current = requestAnimationFrame(updateParticles);
    };

    animationFrameRef.current = requestAnimationFrame(updateParticles);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Set up Message Handlers
  const handleIncomingMessage = (newMessage: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    // Deduplicate rapid simulated/duplicate events (within 300ms) with the same payload
    const now = Date.now();
    const eventFingerprint = [
      newMessage.type,
      newMessage.uniqueId,
      newMessage.comment || '',
      (newMessage as any).giftName || ''
    ].join('|');
    const lastEventTime = recentEventsRef.current.get(eventFingerprint);
    if (lastEventTime && now - lastEventTime < 300) {
      console.log('Discarding duplicate/strict-mode incoming message:', eventFingerprint);
      return;
    }
    recentEventsRef.current.set(eventFingerprint, now);

    setLastActivity(Date.now());
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    const messageObj: ChatMessage = { ...newMessage, id, timestamp };

    // Filter messages based on active Overlay Mode
    if (settings.mode === 'images_only' && messageObj.type !== 'share_image') {
      return;
    }
    if (settings.mode === 'chat_alerts' && messageObj.type === 'share_image') {
      return;
    }
    if (settings.mode === 'chat_only' && messageObj.type !== 'chat') {
      return;
    }
    if (settings.mode === 'alerts_only' && (messageObj.type === 'chat' || messageObj.type === 'share_image')) {
      return;
    }

    // 1. Audit filters
    if (settings.ignoredUsers.some(user => user.toLowerCase() === newMessage.uniqueId.toLowerCase())) {
      return;
    }

    // Highlight key check
    const isHighlighted = messageObj.comment && settings.highlightKeywords.some(keyword => 
      messageObj.comment?.toLowerCase().includes(keyword.toLowerCase())
    );

    // 2. Play Audio prompt
    if (messageObj.type === 'chat') {
      triggerSound('chat');
    } else if (messageObj.type === 'gift') {
      triggerSound('gift');
    } else if (messageObj.type === 'share_image') {
      triggerSound('image');
    } else {
      triggerSound('alert');
    }

    // 3. Trigger TTS if applicable
    if (settings.textToSpeech) {
      if (messageObj.type === 'chat' && (settings.ttsReadChat !== false) && messageObj.comment) {
        const { text, isThai } = prepareTTSMsg('chat', messageObj.nickname, messageObj.comment);
        if (text) triggerTTS(text, isThai);
      } else if (messageObj.type === 'gift' && (settings.ttsReadGift !== false)) {
        const { text, isThai } = prepareTTSMsg('gift', messageObj.nickname, messageObj.giftName || '');
        if (text) triggerTTS(text, isThai);
      } else if (messageObj.type === 'follow' && (settings.ttsReadFollow !== false)) {
        const { text, isThai } = prepareTTSMsg('follow', messageObj.nickname, '');
        if (text) triggerTTS(text, isThai);
      } else if (messageObj.type === 'share_image' && (settings.ttsReadShareImage !== false)) {
        const { text, isThai } = prepareTTSMsg('share_image', messageObj.nickname, messageObj.comment || '');
        if (text) triggerTTS(text, isThai);
      }
    }

    // Trigger hearts falling into glass for 'like' event
    if (messageObj.type === 'like') {
      triggerFallingHearts(Math.max(5, Math.min(22, (messageObj.likeCount || 5) * 2)));
    }

    // Trigger falling gift emojis into glass for 'gift' event
    if (messageObj.type === 'gift') {
      const giftCount = Math.max(12, Math.min(36, (messageObj.repeatCount || 1) * 8));
      const giftEmojis = ['🎁', '👑', '💎', '🧸', '🎈', '🎉', '🌹', '✨', '💛', '🌟', '💝', '💖'];
      triggerFallingHearts(giftCount, giftEmojis);
    }

    // 4. Update core comments stack or image alerts stack
    if (messageObj.type === 'share_image' && settings.showImageAlerts !== false) {
      setImageShareAlert(messageObj);
      // Sparkle burst on the right side for the image notification card
      generateSparkleBurst(getStageWidth() - 180, 180, settings.theme);
    } else {
      setMessages(prev => {
        const merged = [...prev, messageObj];
        if (merged.length > settings.maxMessages) {
          return merged.slice(merged.length - settings.maxMessages);
        }
        return merged;
      });
    }

    // 4.5 Update/spawn Stream Avatar bubble text and trigger reaction jump
    if (settings.showWalkingAvatars !== false && (settings.mode === 'avatars' || settings.mode === 'all' || settings.mode === 'chat_alerts' || settings.mode === 'chat_only')) {
      const msgUniqueId = messageObj.uniqueId;
      const msgNickname = messageObj.nickname;
      const msgComment = messageObj.comment || '';

      let avatarBubbleText = '';
      if (messageObj.type === 'chat') {
        avatarBubbleText = msgComment;
      } else if (messageObj.type === 'gift') {
        avatarBubbleText = `ส่งของขวัญ ${messageObj.giftName} x${messageObj.repeatCount || 1}! 🎁`;
      } else if (messageObj.type === 'follow') {
        avatarBubbleText = `ผู้ติดตามใหม่คนสำคัญครับ! 💖`;
      } else if (messageObj.type === 'like') {
        avatarBubbleText = `ถูกใจสตรีมสดแล้วนะค้าบ (x${messageObj.likeCount || 1})! 👍`;
      } else if (messageObj.type === 'share') {
        avatarBubbleText = `แชร์ไลฟ์สดนี้ให้แล้วนะค้าบ! 🚀`;
      } else if (messageObj.type === 'share_image') {
        avatarBubbleText = `ส่งของขวัญรูปภาพเด็ดๆ ให้ชม! 🖼️ ${msgComment ? `"${msgComment}"` : ''}`;
      }

      if (avatarBubbleText) {
        setAvatars(prev => {
          const index = prev.findIndex(av => av.uniqueId.toLowerCase() === msgUniqueId.toLowerCase());
          
          if (index !== -1) {
            // Update existing avatar: trigger jump and speech bubble
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              nickname: msgNickname,
              bubbleText: avatarBubbleText,
              bubbleTime: Date.now() + 6500, // bubble lasts 6.5s
              vy: updated[index].isJumping ? updated[index].vy : -9, // Jump on speak!
              lastActive: Date.now()
            };
            return updated;
          } else {
            // Spawn new avatar
            const pool = getAvatarPool();
            const randomSpriteIndex = Math.floor(Math.random() * pool.length);
            const rSpeedIndex = Math.random() > 0.5 ? 1 : -1;
            const newAv: StreamAvatar = {
              id: Math.random().toString(36).substring(2, 9),
              uniqueId: msgUniqueId,
              nickname: msgNickname,
              x: 10 + Math.random() * 80,
              y: 0,
              vx: (Math.random() * 0.1 + 0.08) * rSpeedIndex,
              vy: -11, // Spawn with a cute leap
              facing: rSpeedIndex > 0 ? 'right' : 'left',
              isJumping: true,
              spriteUrl: pool[randomSpriteIndex].spriteUrl,
              scale: pool[randomSpriteIndex].scale || 1.1,
              bubbleText: avatarBubbleText,
              bubbleTime: Date.now() + 6500,
              lastActive: Date.now()
            };
            
            // Separate configured and viewer (visitor) avatars to enforce hard limit
            const visitors = prev.filter(av => !pool.some(p => p.id === av.id || (av.uniqueId && av.uniqueId.toLowerCase().includes(p.name.toLowerCase().replace(/\s+/g, '_')))));
            const configured = prev.filter(av => pool.some(p => p.id === av.id || (av.uniqueId && av.uniqueId.toLowerCase().includes(p.name.toLowerCase().replace(/\s+/g, '_')))));
            
            // Limit visitor avatars to maximum setting to prevent screen cluttering
            const maxVisitors = settings.maxVisitorAvatars !== undefined ? settings.maxVisitorAvatars : 1;
            const trimmedVisitors = visitors.length >= maxVisitors ? (maxVisitors > 1 ? visitors.slice(visitors.length - (maxVisitors - 1)) : []) : visitors;
            return [...configured, ...trimmedVisitors, newAv];
          }
        });
      }
    }

    // 5. Construct Visual Alert Banner for crucial events (Follow, Gift, Share, Like above 5x)
    if (messageObj.type !== 'chat' && messageObj.type !== 'share_image') {
      let detailText = '';
      if (messageObj.type === 'gift') {
        detailText = `ส่งของขวัญ ${messageObj.giftName} x${messageObj.repeatCount || 1}!`;
      } else if (messageObj.type === 'follow') {
        detailText = `ได้กดติดตามแล้ว!`;
      } else if (messageObj.type === 'share') {
        detailText = `ได้แชร์สตรีมแล้ว!`;
      } else if (messageObj.type === 'like') {
        detailText = `ได้ถูกใจสตรีมแล้ว!`;
      }

      const alertId = Math.random().toString(36).substr(2, 9);
      const alertObj: AlertEvent = {
        id: alertId,
        type: messageObj.type as any,
        uniqueId: messageObj.uniqueId,
        nickname: messageObj.nickname,
        profilePictureUrl: messageObj.profilePictureUrl,
        detailText,
        timestamp
      };

      setActiveAlert(alertObj);
      // Sparkle burst in middle of the screen
      generateSparkleBurst(getStageWidth() / 2, 80, settings.theme);
    }
  };

  // Wire up simulation support so dashboard buttons inject events
  useEffect(() => {
    if (isDemo) {
      const handleCustomEvent = (e: CustomEvent) => {
        handleIncomingMessage(e.detail);
      };
      window.addEventListener('simulated-chat-overlay-event', handleCustomEvent as EventListener);
      return () => {
        window.removeEventListener('simulated-chat-overlay-event', handleCustomEvent as EventListener);
      };
    }
  }, [isDemo, settings]);

  // Clean-up expired messages periodically if messageLifetime > 0
  useEffect(() => {
    if (settings.messageLifetime <= 0) return;

    const timer = setInterval(() => {
      const cutoff = Date.now() - (settings.messageLifetime * 1000);
      setMessages(prev => prev.filter(m => m.timestamp > cutoff));
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.messageLifetime]);

  // Clean-up inactive visitor avatars periodically (every 2 seconds) to keep screen clutter-free
  useEffect(() => {
    if (settings.showWalkingAvatars === false) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const pool = getAvatarPool();
      
      setAvatars(prev => {
        return prev.filter(av => {
          // Keep if it matches a configured/default pool avatar
          const isConfigured = pool.some(item => item.id === av.id || (av.uniqueId && av.uniqueId.toLowerCase().includes(item.name.toLowerCase().replace(/\s+/g, '_'))));
          if (isConfigured) return true;

          // Keep visitor avatars only if active within the last 20 seconds
          const lastActive = av.lastActive || now;
          const isActive = (now - lastActive) < 20000; // 20s lifespan
          return isActive;
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [settings.showWalkingAvatars, settings.customAvatars]);

  // Alert Auto-Dismiss timer
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 4500); // Overlay banners persist 4.5 seconds

    return () => clearTimeout(timer);
  }, [activeAlert]);

  // Image Alert Auto-Dismiss timer
  useEffect(() => {
    if (!imageShareAlert) return;
    const timer = setTimeout(() => {
      setImageShareAlert(null);
    }, 9500); // Image alerts persist 9.5 seconds

    return () => clearTimeout(timer);
  }, [imageShareAlert]);

  // Establish actual stream WebSocket connection (Unless pure Demo)
  useEffect(() => {
    if (isDemo) {
      setWsStatus('connected');
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectToSource = () => {
      setWsStatus('connecting');
      try {
        console.log(`Spinning up IndoFinity WebSocket at: ${settings.wsUrl}`);
        socket = new WebSocket(settings.wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log('Connected to IndoFinity WebSocket successfully!');
          setWsStatus('connected');
        };

        socket.onmessage = (event) => {
          setLastActivity(Date.now());
          try {
            const message = JSON.parse(event.data);
            const { event: streamEvent, data: eventData } = message;

            console.log(`Event parsed: ${streamEvent}`, eventData);

            // Auto detect viewer count from various stream connector payloads
            if (message && typeof message === 'object') {
              const viewerFields = ['viewerCount', 'memberCount', 'viewersCount', 'viewer_count', 'viewers', 'activeViewers', 'userCount', 'count'];
              for (const field of viewerFields) {
                if (typeof message[field] === 'number') {
                  setActiveViewers(message[field]);
                  break;
                }
              }
            }
            if (eventData && typeof eventData === 'object') {
              const viewerFields = ['viewerCount', 'memberCount', 'viewersCount', 'viewer_count', 'viewers', 'activeViewers', 'userCount', 'count', 'member_count'];
              for (const field of viewerFields) {
                if (typeof eventData[field] === 'number') {
                  setActiveViewers(eventData[field]);
                  break;
                } else if (typeof eventData[field] === 'string' && !isNaN(Number(eventData[field]))) {
                  setActiveViewers(Number(eventData[field]));
                  break;
                }
              }
            }
            if (streamEvent === 'roomViewer' || streamEvent === 'memberCount' || streamEvent === 'viewerCount' || streamEvent === 'viewer') {
              const count = eventData?.viewerCount ?? eventData?.memberCount ?? eventData?.count ?? eventData?.viewer_count;
              if (count !== undefined && count !== null) {
                setActiveViewers(Number(count));
              }
            }

            if (streamEvent === 'chat') {
              handleIncomingMessage({
                type: 'chat',
                uniqueId: eventData.uniqueId || 'chat_user',
                nickname: eventData.nickname || eventData.uniqueId || 'User',
                comment: eventData.comment || '',
                profilePictureUrl: eventData.profilePictureUrl || undefined,
                isModerator: !!(eventData.isModerator || eventData.moderator),
                isSubscriber: !!(eventData.isSubscriber || eventData.subscriber),
                isVip: !!(eventData.isVip || eventData.vip)
              });
            } else if (streamEvent === 'gift') {
              handleIncomingMessage({
                type: 'gift',
                uniqueId: eventData.uniqueId || 'gifter',
                nickname: eventData.nickname || eventData.uniqueId || 'Gifter',
                comment: `Sent ${eventData.giftName} x${eventData.repeatCount || 1}`,
                profilePictureUrl: eventData.profilePictureUrl || undefined,
                giftName: eventData.giftName || 'Gift',
                giftIcon: eventData.giftIcon || undefined,
                repeatCount: eventData.repeatCount || 1,
                diamondCount: eventData.diamondCount || 0
              });
            } else if (streamEvent === 'like') {
              handleIncomingMessage({
                type: 'like',
                uniqueId: eventData.uniqueId || 'liker',
                nickname: eventData.nickname || eventData.uniqueId || 'Liker',
                likeCount: eventData.likeCount || 5,
                profilePictureUrl: eventData.profilePictureUrl || undefined
              });
            } else if (streamEvent === 'follow') {
              handleIncomingMessage({
                type: 'follow',
                uniqueId: eventData.uniqueId || 'follower',
                nickname: eventData.nickname || eventData.uniqueId || 'Follower',
                profilePictureUrl: eventData.profilePictureUrl || undefined
              });
            } else if (streamEvent === 'share') {
              handleIncomingMessage({
                type: 'share',
                uniqueId: eventData.uniqueId || 'sharer',
                nickname: eventData.nickname || eventData.uniqueId || 'Sharer',
                profilePictureUrl: eventData.profilePictureUrl || undefined
              });
            } else if (streamEvent === 'share_image' || streamEvent === 'image') {
              handleIncomingMessage({
                type: 'share_image',
                uniqueId: eventData.uniqueId || 'image_sender',
                nickname: eventData.nickname || eventData.uniqueId || 'Image Sender',
                comment: eventData.comment || eventData.commentText || '',
                profilePictureUrl: eventData.profilePictureUrl || undefined,
                imageUrl: eventData.imageUrl || eventData.image || ''
              });
            }
          } catch (err) {
            console.error('Error parsing IndoFinity message payload:', err);
          }
        };

        socket.onerror = (err) => {
          console.error('IndoFinity WebSocket Error:', err);
          setWsStatus('disconnected');
        };

        socket.onclose = () => {
          console.log('IndoFinity socket closed. Retrying stream feed...');
          setWsStatus('disconnected');
          // Self-heal and trigger auto reconnect wait loop
          reconnectTimeout = setTimeout(connectToSource, 3500);
        };
      } catch (e) {
        console.error('Connection setup failed:', e);
        setWsStatus('disconnected');
        reconnectTimeout = setTimeout(connectToSource, 3500);
      }
    };

    connectToSource();

    return () => {
      if (socket) {
        // Clear onclose overrides to avoid double fire reconnect hooks
        socket.onclose = null;
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [settings.wsUrl, settings]);

  // Framer Motion variant setup based on user settings selection
  const getAnimationVariants = () => {
    switch (settings.animationStyle) {
      case 'slide-left':
        return {
          initial: { opacity: 0, x: 100, scale: 0.9 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: -60, transition: { duration: 0.2 } }
        };
      case 'fade-in':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0, transition: { duration: 0.2 } }
        };
      case 'scale-pop':
        return {
          initial: { opacity: 0, scale: 0.2, y: 15 },
          animate: { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { type: 'spring', damping: 15, stiffness: 200 } 
          },
          exit: { opacity: 0, scale: 0.5, transition: { duration: 0.15 } }
        };
      case 'slide-up':
      default:
        return {
          initial: { opacity: 0, y: 30, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.2 } }
        };
    }
  };

  // Theme styling generator mapping
  const getThemeClasses = (msg: ChatMessage) => {
    const isSpecialType = msg.type !== 'chat';
    const isKeywordHighlighted = msg.comment && settings.highlightKeywords.some(kw => msg.comment?.toLowerCase().includes(kw.toLowerCase()));

    switch (settings.theme) {
      case 'geometric':
        return {
          wrapper: `relative border-l-2 p-3 bg-[#0c0c0e]/95 mb-2.5 shadow-sm border border-zinc-800/80 overflow-hidden flex items-start gap-2.5 select-none ${
            isSpecialType 
              ? 'border-l-indigo-500' 
              : isKeywordHighlighted 
                ? 'border-l-rose-500 bg-rose-950/10' 
                : 'border-l-zinc-500'
          }`,
          name: 'text-[12px] font-bold tracking-tight text-white font-mono',
          body: `font-sans text-[12.5px] leading-relaxed text-zinc-300 break-words w-full overflow-hidden truncate`,
          badge: 'bg-zinc-900 border border-zinc-800 text-[8.5px] px-1 py-0.5 rounded-none font-mono font-bold',
          badgeText: 'text-zinc-400'
        };

      case 'cyberpunk':
        return {
          wrapper: `relative border-l-4 p-3 bg-slate-950/85 mb-3 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden flex items-start gap-3 select-none ${
            isSpecialType 
              ? 'border-l-[#00F0FF] border border-cyan-500/10 shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
              : isKeywordHighlighted 
                ? 'border-l-[#FF007F] border border-pink-500/10 shadow-[0_0_15px_rgba(255,0,127,0.25)] ring-1 ring-pink-500/30' 
                : 'border-l-pink-500 border border-pink-500/5'
          }`,
          name: 'text-[11px] font-bold tracking-wider uppercase font-mono',
          body: `font-sans leading-relaxed tracking-wide text-slate-100 break-words w-full overflow-hidden truncate`,
          badge: 'bg-black/60 text-[9px] px-1.5 py-0.5 rounded font-mono',
          badgeText: 'text-[#00F0FF]'
        };
      
      case 'glassmorphism':
        return {
          wrapper: `relative p-3.5 rounded-xl border mb-3 backdrop-blur-md flex items-start gap-3 select-none ${
            isSpecialType 
              ? 'bg-amber-500/15 border-amber-300/30 shadow-[0_8px_32px_0_rgba(245,158,11,0.15)] ring-1 ring-amber-400/20' 
              : isKeywordHighlighted 
                ? 'bg-indigo-600/20 border-indigo-400/40 shadow-[0_8px_32px_0_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/30' 
                : 'bg-slate-950/45 border-white/10 shadow-[0_6px_20px_0_rgba(0,0,0,0.2)]'
          }`,
          name: 'text-[13px] font-semibold text-white tracking-normal',
          body: 'font-normal text-slate-100 text-shadow break-words w-full overflow-hidden truncate',
          badge: 'bg-white/15 px-1.5 py-0.5 rounded-full text-[10px] text-white backdrop-blur-sm border border-white/10',
          badgeText: 'text-white/90'
        };

      case 'bubblechat':
        return {
          wrapper: `relative p-3.5 rounded-2xl rounded-tl-sm mb-3 flex items-start gap-3 select-none shadow-md ${
            isSpecialType 
              ? 'bg-amber-50 border border-amber-200 text-slate-800' 
              : isKeywordHighlighted 
                ? 'bg-rose-50 border border-rose-300 ring-2 ring-rose-300/30 text-slate-800' 
                : 'bg-white border border-slate-100 text-slate-700'
          }`,
          name: 'text-[12.5px] font-bold text-slate-800',
          body: 'leading-relaxed break-words w-full overflow-hidden truncate',
          badge: 'bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-md flex items-center',
          badgeText: 'text-slate-600 font-medium'
        };

      case 'minimal':
        return {
          wrapper: `relative py-1.5 px-2 bg-black/35 backdrop-blur-xs rounded-lg mb-2 flex items-center gap-2 select-none overflow-hidden hover:bg-black/50 transition-colors ${
            isSpecialType 
              ? 'border border-amber-400/40 border-dashed bg-amber-950/20' 
              : isKeywordHighlighted 
                ? 'border border-rose-500/40 bg-rose-950/20' 
                : ''
          }`,
          name: 'text-[12px] font-bold whitespace-nowrap',
          body: 'text-slate-100 break-words w-full overflow-hidden truncate font-medium text-[13px]',
          badge: 'text-[9px] scale-90 p-0.5 font-bold',
          badgeText: 'text-slate-200'
        };

      case 'retro':
        return {
          wrapper: `relative border-2 border-slate-900 p-3 bg-slate-900 mb-3 select-none shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
            isSpecialType 
              ? 'border-yellow-400 border-2' 
              : isKeywordHighlighted 
                ? 'border-purple-400 border-2 shadow-[4px_4px_0_0_rgba(147,51,234,1)]' 
                : ''
          }`,
          name: 'text-[12px] font-bold uppercase tracking-wider text-green-400 font-mono',
          body: 'font-mono text-[12.5px] tracking-tight leading-loose text-white break-words w-full overflow-hidden truncate',
          badge: 'border border-lime-400 px-1 py-0.5 text-[9px] rounded-none font-mono font-bold',
          badgeText: 'text-lime-300 uppercase'
        };

      case 'neon-glow':
        return {
          wrapper: `relative p-3.5 bg-[#0b0416]/90 mb-3 border-2 rounded-xl flex items-start gap-3 select-none ${
            isSpecialType 
              ? 'border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]' 
              : isKeywordHighlighted 
                ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' 
                : 'border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
          }`,
          name: 'text-[12px] font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-mono',
          body: 'leading-relaxed break-words w-full overflow-hidden truncate text-violet-100 font-medium',
          badge: 'bg-fuchsia-950/50 text-[#f472b6] text-[9px] px-1.5 py-0.5 rounded-full border border-fuchsia-500/30',
          badgeText: 'text-fuchsia-300 font-bold'
        };

      case 'kawaii':
        return {
          wrapper: `relative p-3.5 bg-rose-50/95 mb-3 border-[3px] border-pink-200 rounded-3xl rounded-tl-sm flex items-start gap-3 select-none shadow-[0_4px_10px_rgba(244,114,182,0.15)] ${
            isSpecialType 
              ? 'bg-amber-50 border-amber-200 shadow-[0_4px_10px_rgba(245,158,11,0.15)]' 
              : isKeywordHighlighted 
                ? 'bg-red-50 border-red-200 shadow-[0_4px_10px_rgba(239,68,68,0.15)]' 
                : ''
          }`,
          name: 'text-[12.5px] font-black text-pink-500 font-sans tracking-wide',
          body: 'leading-relaxed break-words w-full overflow-hidden truncate text-pink-900 font-semibold',
          badge: 'bg-pink-100 text-pink-600 text-[9px] px-2 py-0.5 rounded-full font-bold border border-pink-200',
          badgeText: 'text-pink-500 font-bold'
        };

      case 'gaming-red':
        return {
          wrapper: `relative p-3 bg-zinc-950 mb-2.5 border-l-[3px] border-r border-t border-b border-zinc-900 border-l-red-600 flex items-start gap-3 select-none skew-x-[-3deg] hover:border-l-red-500 transition-all ${
            isSpecialType 
              ? 'bg-zinc-900/40 border-l-red-500 ring-1 ring-red-500/20' 
              : isKeywordHighlighted 
                ? 'bg-zinc-900/60 border-l-rose-500 ring-1 ring-rose-500/30' 
                : ''
          }`,
          name: 'text-[11.5px] font-bold uppercase tracking-widest text-red-500 font-mono',
          body: 'leading-normal break-words w-full overflow-hidden truncate text-zinc-100 font-mono uppercase tracking-tight',
          badge: 'bg-red-950/45 text-red-400 text-[8.5px] px-1 py-0.5 rounded-none font-mono font-bold border border-red-900/50',
          badgeText: 'text-red-400'
        };

      case 'royal-gold':
        return {
          wrapper: `relative p-3.5 bg-neutral-950 mb-3 border border-amber-500/30 border-l-[3px] border-l-amber-500 rounded-lg flex items-start gap-3 select-none shadow-[0_5px_15px_rgba(217,119,6,0.1)] ${
            isSpecialType 
              ? 'border-amber-400/50 bg-neutral-900 shadow-[0_5px_15px_rgba(245,158,11,0.15)]' 
              : isKeywordHighlighted 
                ? 'border-yellow-400/65 bg-[#17130a] shadow-[0_5px_15px_rgba(234,179,8,0.2)]' 
                : ''
          }`,
          name: 'text-[12.5px] font-bold tracking-tight text-amber-500 font-serif',
          body: 'leading-relaxed break-words w-full overflow-hidden truncate text-amber-100 font-medium font-sans',
          badge: 'bg-amber-950/40 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-serif font-bold border border-amber-500/20',
          badgeText: 'text-amber-350'
        };

      case 'cosmic-nebula':
        return {
          wrapper: `relative p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-purple-950/90 mb-3 border border-indigo-500/40 shadow-[0_10px_25px_rgba(139,92,246,0.3),_inset_0_2px_4px_rgba(255,255,255,0.1)] flex items-start gap-3 select-none backdrop-blur-md ${
            isSpecialType 
              ? 'ring-2 ring-pink-500/40 border-pink-400/50' 
              : isKeywordHighlighted 
                ? 'ring-2 ring-cyan-400/40 border-cyan-400/50' 
                : ''
          }`,
          name: 'text-[12.5px] font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-indigo-400 font-sans',
          body: `font-sans leading-relaxed tracking-wide text-zinc-100 break-words w-full overflow-hidden truncate font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`,
          badge: 'bg-indigo-950/80 px-2 py-0.5 rounded-full text-[9px] text-cyan-300 border border-cyan-500/30 font-mono shadow-[0_2px_5px_rgba(0,0,0,0.4)]',
          badgeText: 'text-cyan-300 font-extrabold'
        };

      case 'futuristic-holo':
        return {
          wrapper: `relative p-3.5 bg-cyan-950/20 mb-3 border-l-[4px] border-y border-r border-[#00f3ff]/45 border-l-[#00f3ff] flex items-start gap-3 select-none backdrop-blur-xs skew-x-[-4deg] shadow-[0_5px_15px_rgba(0,243,255,0.2),_inset_0_0_10px_rgba(0,243,255,0.1)] hover:skew-x-0 transition-transform duration-300 ${
            isSpecialType 
              ? 'bg-rose-950/20 border-l-rose-500 border-rose-500/45 shadow-[0_5px_15px_rgba(244,63,94,0.2)]' 
              : isKeywordHighlighted 
                ? 'bg-amber-950/25 border-l-amber-500 border-amber-500/45 shadow-[0_5px_15px_rgba(245,158,11,0.2)]' 
                : ''
          }`,
          name: 'text-[11.5px] font-black tracking-widest text-[#00f3ff] font-mono uppercase',
          body: 'font-mono text-[12.5px] leading-relaxed text-slate-100 break-words w-full overflow-hidden truncate',
          badge: 'bg-black/80 text-[#00f3ff] text-[8.5px] px-1.5 py-0.5 border border-[#00f3ff]/20 font-mono',
          badgeText: 'text-[#00f3ff] font-extrabold'
        };

      case 'luxury-obsidian':
        return {
          wrapper: `relative p-4 rounded-xl bg-gradient-to-b from-[#1c1c1e] to-[#0e0e10] mb-3 border border-amber-500/25 border-b-2 border-b-amber-500/40 flex items-start gap-3.5 select-none shadow-[0_12px_30px_rgba(0,0,0,0.7),_inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-zinc-800 ${
            isSpecialType 
              ? 'border-yellow-400 bg-gradient-to-b from-[#242427] to-[#0e0e11] shadow-[0_12px_30px_rgba(234,179,8,0.2)]' 
              : isKeywordHighlighted 
                ? 'border-rose-500 bg-gradient-to-b from-[#241c1c] to-[#0e0e10] shadow-[0_12px_30px_rgba(244,63,94,0.2)]' 
                : ''
          }`,
          name: 'text-[13px] font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-650 font-serif',
          body: 'font-sans leading-relaxed text-zinc-100 break-words w-full overflow-hidden truncate font-medium text-shadow-sm',
          badge: 'bg-rose-950/75 text-amber-250 text-[9px] px-2 py-0.5 rounded border border-amber-500/30 shadow-[0_1px_4px_rgba(0,0,0,1)] uppercase font-mono',
          badgeText: 'text-amber-250 font-bold'
        };

      case 'vintage-journal':
        return {
          wrapper: `relative p-4 bg-[#fbf5e6] mb-3.5 border border-[#dfd2be] rounded-sm shadow-[4px_4px_0_0_rgba(223,210,190,0.8),_0_8px_16px_rgba(0,0,0,0.15)] rotate-[-0.5deg] flex items-start gap-3 select-none hover:rotate-0 transition-all duration-200 ${
            isSpecialType 
              ? 'bg-[#fffdf9] border-[#c54b3c]/40 ring-1 ring-[#c54b3c]/20 shadow-[4px_4px_0_0_rgba(197,75,60,0.3)]' 
              : isKeywordHighlighted 
                ? 'bg-[#fffdf9] border-amber-600/40 ring-1 ring-amber-600/20' 
                : ''
          }`,
          name: 'text-[12.5px] font-bold text-[#4a3b32] font-mono tracking-tight',
          body: 'font-sans leading-relaxed text-[#5c4a3c] break-words w-full overflow-hidden truncate font-semibold',
          badge: 'bg-[#c54b3c] text-white text-[8.5px] px-2 py-0.5 rounded-full shadow-inner font-bold font-mono tracking-wider',
          badgeText: 'text-white'
        };

      case 'twitch':
      default:
        return {
          wrapper: `relative p-2.5 bg-black/85 mb-2.5 flex items-start gap-2.5 select-none hover:bg-black/95 ${
            isSpecialType 
              ? 'border-l-4 border-l-purple-500' 
              : isKeywordHighlighted 
                ? 'border-l-4 border-l-red-500 bg-[#1f1b24]' 
                : ''
          }`,
          name: 'text-[13px] font-bold leading-none select-text',
          body: 'font-sans leading-normal break-words w-full overflow-hidden truncate text-white',
          badge: 'bg-zinc-800 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-sm flex items-center',
          badgeText: 'text-slate-200 uppercase'
        };
    }
  };

  const getTimerStyles = () => {
    switch (settings.theme) {
      case 'cyberpunk':
        return {
          container: 'bg-slate-950/95 border border-cyan-500/40 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)] p-3 rounded-none font-mono tracking-wider text-center select-none w-[170px]',
          numberClass: 'text-3xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]',
          labelClass: 'text-[9px] text-[#FF007F] font-bold uppercase tracking-widest',
          statusClass: 'bg-cyan-950/60 text-[#00F0FF] border border-[#00F0FF]/30 px-1.5 py-0.5 text-[8.5px] font-bold mt-1 inline-block'
        };
      case 'retro':
        return {
          container: 'bg-black border-4 border-white p-2.5 shadow-[4px_4px_0_rgba(255,255,255,1)] text-white font-mono text-center select-none w-[170px]',
          numberClass: 'text-3xl font-bold text-amber-500 tracking-tight font-mono',
          labelClass: 'text-[9px] text-zinc-400 uppercase tracking-widest',
          statusClass: 'bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-[8.5px] mt-1 text-zinc-350 font-bold inline-block'
        };
      case 'glassmorphism':
        return {
          container: 'bg-white/10 border border-white/20 backdrop-blur-md p-3.5 rounded-2xl text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] text-center select-none w-[170px]',
          numberClass: 'text-3xl font-extrabold text-white tracking-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]',
          labelClass: 'text-[9.5px] text-slate-300 font-medium tracking-wide',
          statusClass: 'bg-white/15 px-2 py-0.5 rounded-full text-[8.5px] border border-white/10 mt-1 text-white/90 inline-block'
        };
      case 'neon-glow':
        return {
          container: 'bg-black/95 border border-[#FF007F]/40 p-3 rounded-xl text-white shadow-[0_0_20px_rgba(255,0,127,0.3)] text-center select-none w-[170px]',
          numberClass: 'text-3xl font-black text-[#FF007F] drop-shadow-[0_0_12px_rgba(255,0,127,0.7)]',
          labelClass: 'text-[9px] text-[#00F0FF] uppercase tracking-widest font-extrabold',
          statusClass: 'text-[#00F0FF] font-bold text-[8.5px] tracking-wide mt-1 animate-pulse inline-block'
        };
      case 'kawaii':
        return {
          container: 'bg-pink-50 border-2 border-pink-200 p-3 rounded-2xl text-pink-600 shadow-[0_4px_12px_rgba(244,63,94,0.1)] text-center select-none w-[170px]',
          numberClass: 'text-3xl font-black text-pink-500 tracking-tight',
          labelClass: 'text-[9.5px] text-pink-400 font-extrabold tracking-wide uppercase',
          statusClass: 'bg-pink-100/80 px-2 py-0.5 rounded-full text-[8.5px] text-pink-500 font-bold mt-1 inline-block'
        };
      case 'gaming-red':
        return {
          container: 'bg-[#121214] border-l-4 border-red-600 p-3 text-white shadow-[0_4px_16px_rgba(0,0,0,0.7)] text-center select-none w-[170px]',
          numberClass: 'text-3xl font-black text-red-500 tracking-widest font-mono',
          labelClass: 'text-[9.5px] text-zinc-400 uppercase tracking-widest',
          statusClass: 'bg-red-950/60 text-red-400 border border-red-900/40 px-2 py-0.5 text-[8px] mt-1 font-mono inline-block'
        };
      case 'royal-gold':
        return {
          container: 'bg-amber-950/85 border-2 border-amber-500/60 p-3 rounded-lg text-amber-200 shadow-[0_4px_20px_rgba(217,119,6,0.2)] text-center select-none w-[170px]',
          numberClass: 'text-3xl font-bold text-amber-400 tracking-normal',
          labelClass: 'text-[9px] text-amber-500/85 uppercase tracking-wider',
          statusClass: 'bg-amber-900/40 text-amber-300 border border-amber-700/30 px-1.5 py-0.5 text-[8px] mt-1 inline-block'
        };
      default:
        return {
          container: 'bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl text-white shadow-lg backdrop-blur-md text-center select-none w-[170px]',
          numberClass: 'text-3xl font-bold text-zinc-100 tracking-tight',
          labelClass: 'text-[9.5px] text-zinc-400 font-mono uppercase tracking-widest',
          statusClass: 'bg-zinc-900 px-1.5 py-0.5 text-[8.5px] text-zinc-400 font-bold border border-zinc-850 mt-1 inline-block'
        };
    }
  };

  const getTransparentTimerStyles = () => {
    const glow = settings.timerGlowColor || 'cyan';
    const size = settings.timerFontSize || 48;
    
    let textShadow = '';
    let textColor = '';
    
    switch (glow) {
      case 'cyan':
        textColor = 'text-cyan-400';
        textShadow = '0 0 5px rgba(6, 182, 212, 0.95), 0 0 15px rgba(6, 182, 212, 0.65), 0 0 30px rgba(6, 182, 212, 0.35), 1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 6px rgba(0,0,0,0.95)';
        break;
      case 'pink':
        textColor = 'text-fuchsia-400';
        textShadow = '0 0 5px rgba(244, 63, 94, 0.95), 0 0 15px rgba(244, 63, 94, 0.65), 0 0 30px rgba(244, 63, 94, 0.35), 1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 6px rgba(0,0,0,0.95)';
        break;
      case 'orange-gold':
        textColor = 'text-amber-400';
        textShadow = '0 0 5px rgba(245, 158, 11, 0.95), 0 0 15px rgba(245, 158, 11, 0.65), 0 0 30px rgba(245, 158, 11, 0.35), 1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 6px rgba(0,0,0,0.95)';
        break;
      case 'white-3d':
        textColor = 'text-white';
        textShadow = '1px 1px 0px #e2e8f0, -1px -1px 0px #475569, 1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 0px #000, 5px 5px 0px #000, 6px 6px 0px #000, 7px 7px 12px rgba(0,0,0,0.95)';
        break;
      case 'green-matrix':
        textColor = 'text-emerald-400';
        textShadow = '0 0 5px rgba(16, 185, 129, 0.95), 0 0 15px rgba(16, 185, 129, 0.65), 0 0 30px rgba(16, 185, 129, 0.35), 1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 6px rgba(0,0,0,0.95)';
        break;
      case 'neon-purple':
        textColor = 'text-fuchsia-400';
        textShadow = '0 0 5px rgba(192, 38, 211, 0.95), 0 0 15px rgba(192, 38, 211, 0.65), 0 0 30px rgba(192, 38, 211, 0.35), 1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 0px #000, 4px 4px 6px rgba(0,0,0,0.95)';
        break;
      default:
        textColor = 'text-cyan-400';
        textShadow = '0 0 5px rgba(6, 182, 212, 0.95), 1px 1px 0px #000, 2px 2px 0px #000, 3px 3px 6px rgba(0,0,0,0.95)';
    }

    return {
      style: {
        fontSize: `${size}px`,
        textShadow,
        fontFamily: settings.fontFamily ? `'${settings.fontFamily}', monospace` : 'monospace',
      },
      className: `${textColor} font-black tracking-wider leading-none text-center select-none`
    };
  };

  const getTimerPositionClass = () => {
    switch (settings.timerPosition) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-24 left-4';
      case 'bottom-right':
        return 'bottom-24 right-4';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      default:
        return 'top-4 left-4';
    }
  };

  const formatTimerString = (rawSeconds: number) => {
    const totalSeconds = Math.max(0, Math.ceil(rawSeconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${pad(minutes)}:${pad(secs)}`;
  };

  return (
    <div 
      className={`${isDemo ? 'absolute z-20' : 'fixed z-50'} inset-0 overflow-hidden flex flex-col justify-end p-4 pointer-events-none select-none bg-transparent`}
      id="chat-overlay-root"
      style={settings.fontFamily ? { fontFamily: `'${settings.fontFamily}', var(--font-sans), sans-serif` } : {}}
    >
      {/* Floating CountDown Stream Timer */}
      {(settings.showTimer || settings.mode === 'timer_only') && (
        <div 
          className={`absolute z-[40] pointer-events-auto ${getTimerPositionClass()}`}
          id="custom-stream-timer-hud"
        >
          {settings.timerOnlyNumbers ? (
            <div 
              style={getTransparentTimerStyles().style}
              className={getTransparentTimerStyles().className}
            >
              {formatTimerString(timerLeft)}
            </div>
          ) : (
            <div className={getTimerStyles().container}>
              <div className={getTimerStyles().labelClass}>⏱️ STREAM TIMER</div>
              <div className={`${getTimerStyles().numberClass} leading-none my-1`}>
                {formatTimerString(timerLeft)}
              </div>
              {timerLeft === 0 ? (
                <span className="bg-rose-950 border border-rose-500 text-rose-300 font-bold px-1.5 py-0.5 text-[8.5px] mt-1 inline-block animate-bounce">
                  🚨 หมดเวลาแล้ว!
                </span>
              ) : timerActive ? (
                <span className={getTimerStyles().statusClass}>
                  🟢 กำลังจับเวลา...
                </span>
              ) : (
                <span className={`${getTimerStyles().statusClass} opacity-65`}>
                  ⏸️ หยุดชั่วคราว
                </span>
              )}
            </div>
          )}
        </div>
      )}



      {/* Absolute canvas for the particle burst system */}
      <canvas 
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        ref={canvas => {
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          // Set canvas boundary constraints dynamically
          if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }}
      />

      {/* Interactive Glass & Falling Hearts Canvas */}
      {settings.mode === 'hearts_glass' && (
        <canvas 
          ref={glassCanvasRef}
          className="absolute inset-0 z-20 w-full h-full pointer-events-none"
        />
      )}

      {/* Donate Goal Mode Overlay (หลอดเป้าหมาย) */}
      {settings.mode === 'donate_goal' && (
        <div className="absolute inset-x-0 top-1/4 flex flex-col items-center justify-center p-6 pointer-events-auto z-30">
          <div className="w-full max-w-sm bg-zinc-950/92 border-2 border-indigo-500/50 rounded-xl p-5 shadow-2xl text-center backdrop-blur-md relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-none">🎯 เป้าหมายยอดโดเนท (Goal)</span>
              <span className="text-xs font-mono font-black text-indigo-300">84.5%</span>
            </div>
            
            <h3 className="text-xs font-bold text-zinc-200 text-left font-sans mb-3 leading-snug">
              🏆 ชาเลนจ์: สมทบทุนทำสีผมใหม่ตามใจแชทสุดเฟี้ยว!
            </h3>
            
            {/* The actual progress bar */}
            <div className="w-full h-6 bg-zinc-900 border border-zinc-800 rounded-none relative p-0.5 overflow-hidden flex items-center">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative transition-all duration-1000"
                style={{ width: '84.5%' }}
              />
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-black text-white text-shadow">
                8,450 THB / 10,000 THB
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2 text-[9px] text-zinc-500 font-mono">
              <span>ผู้สนับสนุนล่าสุด: @SoraChan11</span>
              <span>เหลืออีก: 14 วัน</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Mode Overlay (บอร์ดจัดอันดับผู้สนับสนุน) */}
      {settings.mode === 'leaderboard' && (
        <div className="absolute inset-x-0 top-12 flex flex-col items-center justify-center p-6 pointer-events-auto z-30">
          <div className="w-full max-w-sm bg-zinc-950/95 border-2 border-amber-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse" />
            
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-widest font-mono text-amber-400">ผู้จัดหนักโดเนทประจำสัปดาห์</span>
              </div>
              <span className="text-[8.5px] bg-amber-950 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 font-mono font-bold uppercase">Top 5</span>
            </div>

            <div className="space-y-1.5">
              {[
                { rank: 1, name: 'LantaGamer_TH', amount: '3,500 THB', icon: '🥇', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-200' },
                { rank: 2, name: 'Sora_Chan_Ch', amount: '2,800 THB', icon: '🥈', bg: 'bg-slate-500/5 border-slate-500/15 text-slate-300' },
                { rank: 3, name: 'Sora_Neko', amount: '1,500 THB', icon: '🥉', bg: 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300' },
                { rank: 4, name: 'PekoraFanClub', amount: '1,200 THB', icon: '🎖️', bg: 'bg-zinc-900/40 border-zinc-850/60 text-zinc-400' },
                { rank: 5, name: 'Mr_Beast_Simulator', amount: '950 THB', icon: '🎖️', bg: 'bg-zinc-900/40 border-zinc-850/60 text-zinc-400' },
              ].map((user) => (
                <div key={user.rank} className={`flex items-center justify-between p-2 border rounded-none font-mono text-[10px] ${user.bg}`}>
                  <div className="flex items-center gap-2">
                    <span>{user.icon}</span>
                    <span className="font-bold">@{user.name}</span>
                  </div>
                  <span className="font-black">{user.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connection Failure Warn - purely in dashboard/early-view load, transparent in full stream unless wanted */}
      {!isDemo && wsStatus !== 'connected' && (
        <div className="absolute top-4 left-4 bg-red-950/90 border border-red-500/30 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 backdrop-blur-md pointer-events-auto max-w-sm z-30 transition-all">
          <WifiOff className="text-red-400 w-5 h-5 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <h4 className="text-[12px] font-bold text-red-200 uppercase tracking-widest font-mono">กำลังเชื่อมต่อกับสตรีม...</h4>
            <p className="text-[11px] text-red-300/80 mt-0.5">กำลังพยายามดึงข้อมูลฟีดเซิร์ฟเวอร์จาก: <code className="bg-red-900/40 px-1 py-0.5 rounded font-mono text-[10px] break-all">{settings.wsUrl}</code></p>
          </div>
        </div>
      )}

      {/* Top Center alert notifications banner overlay */}
      {settings.mode !== 'chat_only' && settings.mode !== 'images_only' && settings.mode !== 'avatars' && settings.mode !== 'hearts_glass' && settings.mode !== 'timer_only' && settings.mode !== 'donate_goal' && settings.mode !== 'leaderboard' && (
        <div className="absolute top-8 left-0 right-0 flex justify-center h-28 pointer-events-none z-20">
          <AnimatePresence mode="wait">
            {activeAlert && (
            <motion.div
              initial={{ opacity: 0, y: -45, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.25 } }}
              className="pointer-events-auto"
            >
              {/* Conditional Alert Visual Theme Design matches Settings */}
              {settings.theme === 'geometric' && (
                <div className="relative bg-[#0c0c0e] border border-zinc-800 border-l-2 border-l-indigo-500 px-5 py-3.5 shadow-lg flex items-center gap-3.5 min-w-[320px] overflow-hidden">
                  <div className="bg-zinc-900 border border-zinc-800 w-10 h-10 flex-shrink-0 flex items-center justify-center text-indigo-400 overflow-hidden">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 flex-shrink-0 animate-bounce" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 flex-shrink-0" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 flex-shrink-0 fill-rose-500 text-rose-500" /> :
                      <Share2 className="w-5 h-5 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-mono text-zinc-400 uppercase text-[9px] tracking-widest font-extrabold">ฟีดกิจกรรมใหม่ล่าสุด</h5>
                    <p className="font-sans text-[13px] text-white font-medium mt-0.5">
                      <strong className="text-indigo-400">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'cyberpunk' && (
                <div className="relative bg-slate-950 border-2 border-pink-500 px-6 py-4 rounded shadow-[0_0_25px_rgba(236,72,153,0.4)] flex items-center gap-4 min-w-[320px] overflow-hidden">
                  <div className="absolute -top-10 -left-10 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl animate-pulse" />
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-cyan-500/15 rounded-full blur-2xl animate-pulse" />
                  <div className="relative bg-pink-500/20 w-12 h-12 flex-shrink-0 flex items-center justify-center rounded border border-pink-500/40 overflow-hidden">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover filter brightness-110 contrast-110" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-6 h-6 text-pink-500 flex-shrink-0" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-6 h-6 text-cyan-400 flex-shrink-0" /> :
                      activeAlert.type === 'like' ? <Heart className="w-6 h-6 text-red-500 flex-shrink-0 fill-red-500" /> :
                      <Share2 className="w-6 h-6 text-lime-400 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-mono text-[#00F0FF] uppercase text-[11px] tracking-widest font-extrabold animate-pulse">ตรวจพบกิจกรรมเปิดใหม่</h5>
                    <p className="font-sans text-[13px] text-white font-medium mt-0.5">
                      <strong className="text-pink-500">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'glassmorphism' && (
                <div className="bg-white/10 border border-white/20 backdrop-blur-lg px-6 py-4 rounded-2xl shadow-[0_8px_32px_0_rgba(255,255,255,0.08)] flex items-center gap-4 min-w-[320px]">
                  <div className="bg-white/15 w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full border border-white/10 backdrop-blur-md text-white overflow-hidden">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 flex-shrink-0" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 flex-shrink-0" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 flex-shrink-0 fill-rose-400 text-rose-400" /> :
                      <Share2 className="w-5 h-5 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] text-white">
                      <strong className="font-semibold text-white">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'bubblechat' && (
                <div className="bg-amber-400 text-slate-900 border border-amber-300 px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-4 min-w-[320px]">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-900 rounded-full text-amber-400 overflow-hidden border border-slate-950/10">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 flex-shrink-0" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 flex-shrink-0" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 flex-shrink-0 fill-amber-400" /> :
                      <Share2 className="w-5 h-5 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <span className="text-[12px] font-bold text-slate-800 tracking-wider uppercase">การแจ้งเตือนสตรีมสด</span>
                    <p className="text-[14.5px] font-bold text-slate-950">
                      <strong>@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'minimal' && (
                <div className="bg-black/80 backdrop-blur-md border border-neutral-700/50 px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3.5 min-w-[300px]">
                  {settings.showAvatars && activeAlert.profilePictureUrl ? (
                    <img src={activeAlert.profilePictureUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    activeAlert.type === 'gift' ? <Gift className="w-4 h-4 text-yellow-400 flex-shrink-0" /> :
                    activeAlert.type === 'follow' ? <UserPlus className="w-4 h-4 text-blue-400 flex-shrink-0" /> :
                    activeAlert.type === 'like' ? <Heart className="w-4 h-4 text-green-400 flex-shrink-0" /> :
                    <Share2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  )}
                  <p className="text-[12px] text-white font-mono uppercase tracking-wide">
                    @{activeAlert.nickname} <span className="text-neutral-400">{activeAlert.detailText}</span>
                  </p>
                </div>
              )}

              {settings.theme === 'retro' && (
                <div className="bg-slate-950 border-4 border-lime-400 px-6 py-4 rounded-none shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center gap-4 min-w-[320px] font-mono">
                  <div className="bg-lime-950/20 border-2 border-lime-400 w-11 h-11 flex-shrink-0 flex items-center justify-center text-lime-400 overflow-hidden">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 animate-bounce" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 fill-lime-400" /> :
                      <Share2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-[10px] text-lime-400 font-extrabold uppercase animate-pulse">!ตรวจพบกิจกรรมสำเร็จ!</h5>
                    <p className="text-[13px] text-white mt-1">
                      @{activeAlert.nickname.toUpperCase()} <span className="text-lime-300">{activeAlert.detailText.toUpperCase()}</span>
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'neon-glow' && (
                <div className="relative bg-[#0b0416] border-2 border-fuchsia-500 px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.4)] flex items-center gap-4 min-w-[320px] overflow-hidden">
                  <div className="absolute -top-10 -left-10 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl animate-pulse" />
                  <div className="relative bg-fuchsia-950/45 border border-fuchsia-500/30 w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden text-transparent bg-clip-border">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 text-fuchsia-400 animate-bounce" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 text-cyan-400" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> :
                      <Share2 className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-mono text-cyan-400 uppercase text-[10px] tracking-wider font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 animate-spin" /> NEW SYNTH EVENT
                    </h5>
                    <p className="font-sans text-[13.5px] text-white font-semibold mt-0.5">
                      <strong className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-bold">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'kawaii' && (
                <div className="relative bg-rose-50 text-pink-700 border-[3px] border-pink-200 px-6 py-3.5 rounded-3xl shadow-[0_8px_20px_rgba(244,114,182,0.2)] flex items-center gap-4 min-w-[320px]">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-pink-100 rounded-full text-pink-500 overflow-hidden border border-pink-200">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 text-pink-400 animate-bounce" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 text-pink-500" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 fill-rose-400 text-rose-400" /> :
                      <Share2 className="w-5 h-5 text-pink-500" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-pink-400 font-sans block">✨ กิจกรรมน่ายักกก ✨</span>
                    <p className="text-[13.5px] font-bold text-pink-900 mt-0.5 animate-bounce">
                      <strong>@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'gaming-red' && (
                <div className="relative bg-zinc-950 border-r-2 border-b-2 border-zinc-900 border-l-[4px] border-l-red-600 px-6 py-4 shadow-2xl flex items-center gap-4 min-w-[320px] skew-x-[-3deg] overflow-hidden">
                  <div className="bg-zinc-900 border border-zinc-800 w-11 h-11 flex-shrink-0 flex items-center justify-center text-red-500 overflow-hidden">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 text-red-500 animate-bounce" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 text-red-400" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 text-red-500 fill-red-500" /> :
                      <Share2 className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-mono text-red-400 uppercase text-[10px] tracking-widest font-extrabold">LIVE COMBAT EVENT</h5>
                    <p className="font-mono text-[13px] text-white font-bold uppercase mt-0.5">
                      <strong className="text-red-500">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'royal-gold' && (
                <div className="relative bg-neutral-950 border border-amber-500/30 border-l-[3px] border-l-amber-500 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 min-w-[320px] overflow-hidden">
                  <div className="bg-neutral-900 border border-amber-500/20 w-11 h-11 flex-shrink-0 flex items-center justify-center text-amber-400 overflow-hidden rounded-md">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 text-amber-500 animate-bounce" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 text-amber-400" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 fill-amber-500 text-amber-500" /> :
                      <Share2 className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-serif text-amber-550 uppercase text-[9.5px] tracking-widest font-bold">ROYAL STREAM TRIBUTES</h5>
                    <p className="font-sans text-[13.5px] text-amber-50 mt-1">
                      <strong className="text-amber-400 font-bold font-serif">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'cosmic-nebula' && (
                <div className="relative bg-[#0d0c15] border border-indigo-500/40 px-6 py-4 rounded-2xl shadow-[0_12px_30px_rgba(139,92,246,0.25)] flex items-center gap-4 min-w-[320px] overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                  <div className="bg-indigo-900/40 border border-indigo-500/30 w-11 h-11 flex-shrink-0 flex items-center justify-center text-cyan-400 overflow-hidden rounded-full">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 text-pink-400 animate-bounce" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 text-cyan-400" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 fill-rose-500 text-rose-500" /> :
                      <Share2 className="w-5 h-5 text-[#c084fc]" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-mono text-cyan-400 text-[9.5px] tracking-widest font-extrabold uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-400">COSMIC CELESTIAL SYNC</h5>
                    <p className="font-sans text-[13px] text-white mt-1">
                      <strong className="text-pink-400">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'futuristic-holo' && (
                <div className="relative bg-cyan-950/25 border-y border-r border-l-[4px] border-l-[#00f3ff] border-[#00f3ff]/40 px-6 py-4 shadow-[0_8px_25px_rgba(0,243,255,0.25)] flex items-center gap-4 min-w-[320px] skew-x-[-4deg] overflow-hidden backdrop-blur-xs">
                  <div className="bg-black/40 border border-[#00f3ff]/30 w-11 h-11 flex-shrink-0 flex items-center justify-center text-[#00f3ff] overflow-hidden">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover filter brightness-110" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 text-[#00f3ff] animate-bounce" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 text-[#00f3ff]" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" /> :
                      <Share2 className="w-5 h-5 text-[#00f3ff]" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-mono text-[#00f3ff] text-[9px] tracking-widest font-black uppercase">// SYSTEM_EVENT: INCOMING</h5>
                    <p className="font-mono text-[12.5px] text-slate-100 uppercase mt-0.5">
                      <strong className="text-white">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'luxury-obsidian' && (
                <div className="relative bg-[#111113]/95 border border-amber-500/30 border-b-2 border-b-amber-500/50 px-6 py-4 flex items-center gap-4 min-w-[320px] overflow-hidden rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] ring-1 ring-zinc-800">
                  <div className="bg-neutral-900 border border-amber-500/20 w-11 h-11 flex-shrink-0 flex items-center justify-center text-amber-400 overflow-hidden rounded-md shadow-inner">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 text-yellow-500 animate-bounce" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 text-amber-400" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 fill-yellow-500 text-yellow-500" /> :
                      <Share2 className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-serif text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-600 text-[10px] tracking-wider font-extrabold uppercase">GLOSS OBSIDIAN GLOW</h5>
                    <p className="font-sans text-[13.5px] text-zinc-100 font-semibold mt-0.5">
                      <strong className="text-amber-400 font-serif">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'vintage-journal' && (
                <div className="relative bg-[#fbf5e6] border border-[#dfd2be] px-6 py-4 shadow-[4px_4px_0_0_rgba(223,210,190,0.8),_0_8px_20px_rgba(0,0,0,0.15)] rounded-sm flex items-center gap-4 min-w-[320px] rotate-[-0.5deg]">
                  <div className="bg-[#fffdf9] border border-[#dfd2be] w-10 h-10 flex-shrink-0 flex items-center justify-center text-[#4a3b32] overflow-hidden shadow-inner">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-5 h-5 text-[#c54b3c]" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 text-[#4a3b32]" /> :
                      activeAlert.type === 'like' ? <Heart className="w-5 h-5 text-[#c54b3c] fill-[#c54b3c]" /> :
                      <Share2 className="w-5 h-5 text-[#4a3b32]" />
                    )}
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#8c7460] uppercase tracking-wider font-bold">บันทึกหน้าใหม่จากไลฟ์</span>
                    <p className="font-sans text-[13.5px] text-[#4a3b32] font-bold mt-0.5">
                      <strong>@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'twitch' && (
                <div className="bg-[#18181b] border-l-4 border-l-purple-500 px-5 py-3.5 rounded-sm shadow-2xl flex items-center gap-3.5 min-w-[320px]">
                  <div className="text-purple-400 bg-purple-950/30 w-10 h-10 flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                    {settings.showAvatars && activeAlert.profilePictureUrl ? (
                      <img src={activeAlert.profilePictureUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      activeAlert.type === 'gift' ? <Gift className="w-4 h-4 flex-shrink-0" /> :
                      activeAlert.type === 'follow' ? <UserPlus className="w-4 h-4 flex-shrink-0" /> :
                      activeAlert.type === 'like' ? <Heart className="w-4 h-4 flex-shrink-0 fill-purple-400" /> :
                      <Share2 className="w-4 h-4 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-[10px] text-purple-400 font-semibold tracking-wide uppercase">กิจกรรมสตรีมสด</h5>
                    <p className="text-[13px] text-slate-100 font-bold">
                      @{activeAlert.nickname} <span className="text-slate-300 font-normal">{activeAlert.detailText}</span>
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* Floating separate Shared Image notification card on the right-hand side */}
      <div className="absolute top-24 right-6 flex flex-col items-end pointer-events-none z-30 max-w-[280px]">
        <AnimatePresence mode="wait">
          {imageShareAlert && (
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 120, scale: 0.7, transition: { duration: 0.25 } }}
              className="pointer-events-auto shadow-2xl"
              id={`image-alert-${imageShareAlert.id}`}
            >
              {/* Separate style designs depending on the active Theme selection */}
              {settings.theme === 'geometric' && (
                <div className="relative bg-[#0c0c0e]/95 border border-zinc-800 border-l-2 border-l-pink-500 p-4 shadow-2xl flex flex-col gap-2.5 w-[260px]">
                  <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 px-2 py-1 text-pink-400">
                    <div className="flex items-center gap-1.5 font-mono text-[9px] font-extrabold uppercase tracking-widest text-zinc-350">
                      <Camera className="w-3.5 h-3.5 animate-pulse" /> ผู้ชมแชร์รูปภาพ
                    </div>
                    <span className="font-mono text-[8px] border border-pink-500/35 px-1.5 py-0.5 text-pink-400 font-bold">LIVE</span>
                  </div>
                  <div className="relative border border-zinc-850 bg-black aspect-video overflow-hidden">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-mono text-[11px] font-bold text-pink-400 block truncate">@{imageShareAlert.nickname}</span>
                    {imageShareAlert.comment && (
                      <span className="font-sans text-[11.5px] leading-snug text-zinc-400 block max-h-16 overflow-hidden text-ellipsis line-clamp-3 italic">
                        "{imageShareAlert.comment}"
                      </span>
                    )}
                  </div>
                </div>
              )}

              {settings.theme === 'cyberpunk' && (
                <div className="relative bg-slate-950/95 border-2 border-[#00F0FF] p-4 rounded shadow-[0_0_20px_rgba(0,240,255,0.35)] flex flex-col gap-3 w-[260px] overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-[#00F0FF]" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 bg-pink-500" />
                  <div className="flex items-center justify-between text-[#00F0FF] font-mono text-[9px] uppercase font-bold tracking-widest animate-pulse border-b border-[#00F0FF]/25 pb-1.5">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> DETECTING PHOTO
                    </span>
                    <span className="text-[#00F0FF]">SYS_OK</span>
                  </div>
                  <div className="relative border border-[#00F0FF]/30 bg-black/95 aspect-video overflow-hidden shadow-inner flex items-center justify-center">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 border border-[#00F0FF]/15 bg-[radial-gradient(transparent_60%,rgba(0,240,255,0.1))] pointer-events-none" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] font-extrabold text-[#FF007F] block">@{imageShareAlert.nickname.toUpperCase()}</span>
                    {imageShareAlert.comment && (
                      <p className="font-mono text-[10.5px] leading-snug text-slate-300 break-words max-h-12 overflow-hidden truncate whitespace-normal">
                        &gt;&gt; {imageShareAlert.comment}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {settings.theme === 'glassmorphism' && (
                <div className="bg-white/10 border border-white/20 backdrop-blur-xl p-4 rounded-2xl shadow-[0_12px_40px_0_rgba(255,255,255,0.06)] flex flex-col gap-3 w-[260px]">
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="bg-white/10 p-1.5 rounded-full border border-white/10">
                      <Image className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-[12px] text-white">รูปภาพแชร์ล่าสุด</h5>
                      <span className="text-[10px] text-white/65 block">ส่งโดย @{imageShareAlert.nickname}</span>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black/30 border border-white/10">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {imageShareAlert.comment && (
                    <p className="text-[11px] text-white/95 leading-normal italic bg-white/5 p-2 rounded-lg border border-white/5 max-h-14 overflow-hidden">
                      "{imageShareAlert.comment}"
                    </p>
                  )}
                </div>
              )}

              {settings.theme === 'bubblechat' && (
                <div className="bg-gradient-to-br from-amber-400 to-amber-300 text-slate-900 p-4 rounded-3xl shadow-2xl flex flex-col gap-2.5 w-[250px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-slate-900 shrink-0" /> ผู้ชมทำรายการแชร์รูป
                    </span>
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-ping" />
                  </div>
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border-2 border-slate-900">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="text-slate-950 font-sans">
                    <span className="text-[12px] font-bold block">@{imageShareAlert.nickname}</span>
                    {imageShareAlert.comment && (
                      <p className="text-[11px] font-medium leading-snug mt-0.5 opacity-90 pl-1.5 border-l-2 border-slate-900/60 truncate">
                        {imageShareAlert.comment}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {settings.theme === 'minimal' && (
                <div className="bg-black/90 backdrop-blur-md border border-neutral-800 p-3.5 rounded-xl shadow-2xl flex flex-col gap-2.5 w-[250px]">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-1.5">
                    <Image className="w-3.5 h-3.5 text-pink-500" /> Share by @{imageShareAlert.nickname}
                  </div>
                  <div className="relative rounded-md overflow-hidden aspect-video bg-neutral-900">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {imageShareAlert.comment && (
                    <p className="text-[11px] text-neutral-350 leading-relaxed font-sans px-1 truncate">
                      "{imageShareAlert.comment}"
                    </p>
                  )}
                </div>
              )}

              {settings.theme === 'retro' && (
                <div className="bg-slate-950 border-4 border-yellow-400 p-4 rounded-none shadow-[5px_5px_0_0_rgba(0,0,0,1)] flex flex-col gap-3 w-[260px] font-mono">
                  <div className="bg-yellow-950/20 border-2 border-yellow-400 px-2 py-1 text-center text-yellow-400 text-[9px] font-extrabold uppercase animate-pulse">
                    [ ! NEW IMAGE EVENT ! ]
                  </div>
                  <div className="relative border-2 border-yellow-400 bg-black aspect-video overflow-hidden rounded-none shadow-md">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} referrerPolicy="no-referrer" />
                  </div>
                  <div className="text-white min-w-0">
                    <span className="text-[11.5px] font-extrabold text-lime-400 block truncate">@{imageShareAlert.nickname.toUpperCase()}</span>
                    {imageShareAlert.comment && (
                      <p className="text-[10px] text-slate-350 leading-snug mt-1 uppercase truncate">
                        &gt; {imageShareAlert.comment}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {settings.theme === 'neon-glow' && (
                <div className="relative bg-[#0b0416]/95 border-2 border-fuchsia-500 p-4 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.35)] flex flex-col gap-3 w-[260px] overflow-hidden">
                  <div className="flex items-center justify-between text-cyan-400 font-mono text-[9px] uppercase font-bold tracking-widest border-b border-fuchsia-500/25 pb-1.5 animate-pulse">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" /> DETECTING GLOW PHOTO
                    </span>
                    <span className="text-fuchsia-400">ONLINE</span>
                  </div>
                  <div className="relative rounded bg-slate-950 aspect-video overflow-hidden border border-fuchsia-500/20 shadow-md">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-[11.5px] font-extrabold text-fuchsia-400 block truncate">@{imageShareAlert.nickname}</span>
                    {imageShareAlert.comment && (
                      <p className="font-sans text-[11px] leading-snug text-violet-100 italic truncate">
                        "{imageShareAlert.comment}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {settings.theme === 'kawaii' && (
                <div className="bg-rose-50 border-[3px] border-pink-200 p-4 rounded-3xl shadow-[0_8px_20px_rgba(244,114,182,0.15)] flex flex-col gap-2.5 w-[250px]">
                  <div className="flex items-center gap-2 border-b border-pink-100 pb-2">
                    <div className="bg-pink-100 p-1 rounded-full text-pink-500">
                      <Sparkles className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    </div>
                    <div>
                      <h5 className="font-black text-[12px] text-pink-500">รูปน่ายักที่แชร์มา</h5>
                      <span className="text-[10px] text-pink-400 font-bold block">by @{imageShareAlert.nickname}</span>
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-pink-100 border-2 border-pink-200">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {imageShareAlert.comment && (
                    <p className="text-[11px] text-pink-850 leading-normal italic px-1 truncate">
                      "{imageShareAlert.comment}"
                    </p>
                  )}
                </div>
              )}

              {settings.theme === 'gaming-red' && (
                <div className="relative bg-zinc-950 border-r-2 border-b-2 border-zinc-900 border-l-[3px] border-l-red-600 p-4 shadow-2xl flex flex-col gap-3 w-[260px] skew-x-[-3deg] overflow-hidden">
                  <div className="flex items-center justify-between text-red-500 font-mono text-[9px] uppercase font-bold tracking-widest border-b border-zinc-900 pb-1.5">
                    <span className="flex items-center gap-1 font-extrabold">
                      <Camera className="w-3.5 h-3.5 animate-pulse" /> INCOMING WEBCAM
                    </span>
                    <span className="bg-red-950 border border-red-500/40 text-red-400 px-1 py-0.5 text-[7.5px] font-bold">LIVE</span>
                  </div>
                  <div className="relative border border-zinc-850 bg-black aspect-video overflow-hidden">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-[11px] font-bold text-red-500 block truncate">@{imageShareAlert.nickname.toUpperCase()}</span>
                    {imageShareAlert.comment && (
                      <p className="font-mono text-[10.5px] text-zinc-400 leading-snug uppercase truncate">
                        &gt;&gt; {imageShareAlert.comment}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {settings.theme === 'royal-gold' && (
                <div className="relative bg-neutral-950 border border-amber-500/30 border-l-[3px] border-l-amber-500 p-4 rounded-lg shadow-2xl flex flex-col gap-3 w-[260px] overflow-hidden">
                  <div className="flex items-center gap-2 text-amber-400/90 border-b border-amber-500/15 pb-2">
                    <div className="bg-amber-950/30 p-1.5 rounded text-amber-500 border border-amber-500/20">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="font-serif text-[11px] text-amber-400 font-bold uppercase tracking-wider">Shared Masterpiece</h5>
                      <span className="text-[9.5px] text-amber-300/60 block font-sans">Present by @{imageShareAlert.nickname}</span>
                    </div>
                  </div>
                  <div className="relative rounded-md overflow-hidden aspect-video bg-black/60 border border-amber-500/20">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {imageShareAlert.comment && (
                    <p className="text-[11px] text-amber-100 font-sans italic truncate">
                      "{imageShareAlert.comment}"
                    </p>
                  )}
                </div>
              )}

              {settings.theme === 'cosmic-nebula' && (
                <div className="relative bg-gradient-to-br from-indigo-950/95 via-slate-900/95 to-purple-950/95 border border-indigo-500/40 p-4 rounded-2xl shadow-[0_12px_30px_rgba(139,92,246,0.3)] flex flex-col gap-2.5 w-[260px] overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                  <div className="flex items-center gap-2 text-cyan-400 border-b border-indigo-500/15 pb-2">
                    <div className="bg-indigo-950/40 p-1.5 rounded-full text-cyan-400 border border-cyan-500/30">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="font-mono text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 font-extrabold uppercase tracking-widest">Nebula Snapshot</h5>
                      <span className="text-[9.5px] text-indigo-300/70 block">Present by @{imageShareAlert.nickname}</span>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black/60 border border-indigo-500/20">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {imageShareAlert.comment && (
                    <p className="text-[11px] text-indigo-200 font-sans truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                      "{imageShareAlert.comment}"
                    </p>
                  )}
                </div>
              )}

              {settings.theme === 'futuristic-holo' && (
                <div className="relative bg-cyan-950/20 border-y border-r border-l-[3px] border-l-[#00f3ff] border-[#00f3ff]/40 p-4 shadow-[0_8px_25px_rgba(0,243,255,0.25)] flex flex-col gap-2.5 w-[260px] skew-x-[-3deg] overflow-hidden backdrop-blur-xs">
                  <div className="flex items-center justify-between text-[#00f3ff] font-mono text-[9px] uppercase font-bold tracking-widest border-b border-[#00f3ff]/25 pb-1.5">
                    <span className="flex items-center gap-1 font-black">
                      <Camera className="w-3.5 h-3.5 animate-pulse" /> // INCOMING_HOLO
                    </span>
                    <span className="text-cyan-400">ACTIVE</span>
                  </div>
                  <div className="relative border border-[#00f3ff]/30 bg-black aspect-video overflow-hidden">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover filter brightness-110" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] font-black text-[#00f3ff] block truncate">@{imageShareAlert.nickname.toUpperCase()}</span>
                    {imageShareAlert.comment && (
                      <p className="font-mono text-[10px] text-slate-350 truncate">
                        &gt; {imageShareAlert.comment}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {settings.theme === 'luxury-obsidian' && (
                <div className="relative bg-[#111113]/95 border border-amber-500/30 border-b-2 border-b-amber-500/50 p-4 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] ring-1 ring-zinc-800 flex flex-col gap-3 w-[260px] overflow-hidden">
                  <div className="flex items-center gap-2 text-amber-400 border-b border-amber-500/15 pb-2">
                    <div className="bg-neutral-900 border border-amber-500/20 p-1.5 rounded-md text-amber-500 shadow-inner">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="font-serif text-transparent bg-clip-text bg-gradient-to-r from-yellow-250 via-amber-400 to-yellow-650 text-[11px] font-extrabold uppercase tracking-wide">Obsidian Masterpiece</h5>
                      <span className="text-[9.5px] text-zinc-400 block font-sans">Present by @{imageShareAlert.nickname}</span>
                    </div>
                  </div>
                  <div className="relative rounded bg-[#1c1c21] aspect-video overflow-hidden border border-amber-500/20">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {imageShareAlert.comment && (
                    <p className="text-[11px] text-zinc-300 font-sans italic truncate">
                      "{imageShareAlert.comment}"
                    </p>
                  )}
                </div>
              )}

              {settings.theme === 'vintage-journal' && (
                <div className="relative bg-[#fbf5e6] border border-[#dfd2be] p-4 shadow-[4px_4px_0_0_rgba(223,210,190,0.8),_0_8px_20px_rgba(0,0,0,0.15)] rounded-sm flex flex-col gap-2.5 w-[260px] rotate-[-0.5deg]">
                  <div className="flex items-center gap-2 border-b border-[#dfd2be] pb-2">
                    <div className="bg-[#fffdf9] p-1.5 border border-[#dfd2be] rounded-sm text-[#4a3b32]">
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div>
                      <h5 className="font-black text-[12px] text-[#4a3b32] font-mono">ภาพติดบอร์ดของไลฟ์</h5>
                      <span className="text-[10px] text-[#8c7460] font-bold block">by @{imageShareAlert.nickname}</span>
                    </div>
                  </div>
                  <div className="relative rounded bg-white aspect-video overflow-hidden border border-[#dfd2be]">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {imageShareAlert.comment && (
                    <p className="text-[11.5px] text-[#5c4a3c] font-sans italic truncate">
                      "{imageShareAlert.comment}"
                    </p>
                  )}
                </div>
              )}

              {settings.theme === 'twitch' && (
                <div className="bg-[#18181b] border-l-4 border-l-purple-500 p-4 shadow-2xl flex flex-col gap-2.5 w-[260px]">
                  <div className="flex items-center gap-2 font-sans border-b border-zinc-800 pb-2">
                    <div className="bg-purple-950/30 p-1.5 rounded text-purple-400">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[9px] text-purple-400 font-extrabold tracking-wide uppercase">แชร์รูปภาพสตรีม</h5>
                      <span className="text-[11.5px] font-bold text-white block truncate">@{imageShareAlert.nickname}</span>
                    </div>
                  </div>
                  <div className="relative rounded bg-black aspect-video overflow-hidden">
                    <img src={imageShareAlert.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {imageShareAlert.comment && (
                    <p className="text-[11px] text-zinc-300 font-normal leading-normal py-1 px-1.5 bg-zinc-900 rounded font-sans italic border-l-2 border-zinc-700 truncate">
                      "{imageShareAlert.comment}"
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Primary chat scroll container - bottom aligned */}
      {settings.mode !== 'images_only' && settings.mode !== 'alerts_only' && settings.mode !== 'avatars' && settings.mode !== 'hearts_glass' && settings.mode !== 'timer_only' && settings.mode !== 'donate_goal' && settings.mode !== 'leaderboard' && (
        <div 
          className="w-full max-w-md flex flex-col pointer-events-none self-start relative z-20 overflow-y-auto"
          style={{ fontSize: `${settings.fontSize}px`, maxHeight: '75vh' }}
          id="chat-scroller"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const hasPfp = settings.showAvatars && !!msg.profilePictureUrl;
              const t = getThemeClasses(msg);
              const isHighlighted = msg.comment && settings.highlightKeywords.some(kw => msg.comment?.toLowerCase().includes(kw.toLowerCase()));

              return (
                <motion.div
                  key={msg.id}
                  layout
                  variants={getAnimationVariants()}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25, layout: { type: 'spring', stiffness: 500, damping: 45 } }}
                  id={`chat-msg-${msg.id}`}
                >
                  <div className={t.wrapper}>
                    {/* Glass shimmer overlay for special notifications */}
                    {settings.theme === 'cyberpunk' && msg.type !== 'chat' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}

                    {/* Profile Image avatar if setting checked */}
                    {hasPfp ? (
                      <img 
                        src={msg.profilePictureUrl} 
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-white/20 shadow flex-shrink-0 object-cover mt-[2px]" 
                      />
                    ) : (
                      // Default Fallback avatar
                      settings.showAvatars && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-inner flex-shrink-0 mt-[2px]"
                          style={{ backgroundColor: getUserColor(msg.uniqueId) }}
                        >
                          {msg.nickname.charAt(0).toUpperCase()}
                        </div>
                      )
                    )}

                    <div className="flex-1 min-w-0" style={{ fontSize: `${settings.fontSize}px` }}>
                      {/* Username line with possible stream badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {/* Show structural custom badges if setting enabled */}
                        {settings.showBadges && (
                          <>
                            {msg.isModerator && (
                              <span className={t.badge} title="Moderator">
                                <Shield className={`w-3 h-3 ${settings.theme === 'cyberpunk' ? 'text-[#00F0FF]' : 'text-green-400'}`} />
                                <span className={`ml-0.5 text-[8.5px] font-mono leading-none ${t.badgeText}`}>MOD</span>
                              </span>
                            )}
                            {msg.isSubscriber && (
                              <span className={t.badge} title="Subscriber">
                                <Star className={`w-3 h-3 ${settings.theme === 'cyberpunk' ? 'text-pink-500' : 'text-amber-400'}`} />
                                <span className={`ml-0.5 text-[8.5px] font-mono leading-none ${t.badgeText}`}>SUB</span>
                              </span>
                            )}
                            {msg.isVip && (
                              <span className={t.badge} title="VIP">
                                <Award className="w-3 h-3 text-purple-400" />
                                <span className={`ml-0.5 text-[8.5px] font-mono leading-none ${t.badgeText}`}>VIP</span>
                              </span>
                            )}
                          </>
                        )}

                        {/* Display name */}
                        <span 
                          className={t.name}
                          style={{ color: settings.theme === 'twitch' ? getUserColor(msg.uniqueId) : undefined }}
                        >
                          {msg.nickname}
                        </span>

                        {/* Unique tag */}
                        <span className="opacity-45 text-[10px] font-mono lowercase truncate max-w-[80px]">
                          @{msg.uniqueId}
                        </span>
                      </div>

                      {/* Chat Text Body or Specific Alert Details inline */}
                      <div className={t.body}>
                        {msg.type === 'chat' ? (
                          <p className={isHighlighted ? 'text-yellow-250 font-medium' : ''}>
                            {msg.comment}
                          </p>
                        ) : msg.type === 'gift' ? (
                          <div className="flex items-center gap-1 bg-amber-900/15 text-amber-500 border border-amber-500/10 px-1.5 py-1 rounded inline-flex">
                            {msg.giftIcon ? (
                              <img src={msg.giftIcon} alt="" className="w-5 h-5 flex-shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <Gift className="w-4 h-4 flex-shrink-0 animate-bounce" />
                            )}
                            <span className="font-semibold text-[13px]">
                              ส่งของขวัญ {msg.giftName} <strong className="text-amber-400 text-[14px]">x{msg.repeatCount}</strong> ชิ้น!
                            </span>
                          </div>
                        ) : msg.type === 'follow' ? (
                          <span className="text-cyan-400 font-semibold flex items-center gap-1 py-0.5">
                            <UserPlus className="w-3.5 h-3.5 flex-shrink-0 inline" /> ได้กดติดตามสตรีมสดแล้ว!
                          </span>
                        ) : msg.type === 'like' ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1 py-0.5">
                            <Heart className="w-3.5 h-3.5 flex-shrink-0 inline fill-rose-500 text-rose-500" /> ถูกใจสตรีมสดแล้ว (x{msg.likeCount})!
                          </span>
                        ) : (
                          <span className="text-lime-400 font-semibold flex items-center gap-1 py-0.5">
                            <Share2 className="w-3.5 h-3.5 flex-shrink-0 inline" /> ได้ช่วยแชร์สตรีมสดแล้ว!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Stream Avatars walking stage */}
      {settings.showWalkingAvatars !== false && (settings.mode === 'avatars' || settings.mode === 'all') && (
        <div 
          className={`absolute inset-x-0 bottom-2 h-[220px] pointer-events-none z-30 font-sans overflow-visible select-none transition-all duration-700 ease-in-out ${
            (settings.hideAvatarsWhenNoViewers && activeViewers === 0) || (settings.hideWhenIdle && isIdle)
              ? 'opacity-0 scale-95 pointer-events-none translate-y-12'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          {avatars.map(av => {
            const isBubbleActive = av.bubbleText && av.bubbleTime > Date.now();
            return (
              <div
                key={av.id}
                className="absolute transition-all duration-[16ms] ease-linear flex flex-col items-center overflow-visible"
                style={{
                  left: `${av.x}%`,
                  bottom: `${av.y}px`,
                  transform: 'translateX(-50%)',
                  transformOrigin: 'bottom center'
                }}
              >
                {/* Speech Bubble above head */}
                <AnimatePresence>
                  {isBubbleActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7, y: -10, transition: { duration: 0.18 } }}
                      className="relative mb-2.5 bg-zinc-950/95 text-white text-[11.5px] px-3 py-2 max-w-[160px] border border-pink-500 rounded-2xl shadow-[0_4px_12px_rgba(236,72,153,0.25)] text-center break-words font-medium overflow-visible leading-relaxed flex flex-col items-center select-text pointer-events-auto"
                    >
                      <span className="font-bold text-[9px] text-pink-400 font-mono tracking-tight mb-0.5 truncate max-w-full">
                        @{av.nickname}
                      </span>
                      {av.bubbleText}
                      {/* Triangle Notch pointed down at head */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-pink-500" />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-zinc-950" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Avatar character sprite with cute walking bounce animation */}
                <div className="relative flex flex-col items-center">
                  {av.spriteUrl.startsWith('vector:') ? (
                    <div 
                      className={`transition-transform duration-200 ${
                        av.isJumping ? 'animate-none' : 'animate-[bounce_2.2s_infinite_ease-in-out]'
                      }`}
                      style={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))'
                      }}
                    >
                      <VectorAvatar 
                        type={av.spriteUrl.replace('vector:', '')} 
                        facing={av.facing} 
                        isJumping={av.isJumping} 
                        isSpeaking={!!isBubbleActive} 
                        scale={av.scale || 1.15}
                      />
                    </div>
                  ) : (
                    <img
                      src={av.spriteUrl}
                      alt=""
                      className={`object-contain select-none pointer-events-none transition-transform duration-200 ${
                        av.facing === 'left' ? 'scale-x-[-1]' : 'scale-x-[1]'
                      } ${
                        av.isJumping ? 'animate-none' : 'animate-[bounce_1.8s_infinite_ease-in-out]'
                      }`}
                      style={{
                        height: `${55 * (av.scale || 1.0)}px`,
                        width: `${55 * (av.scale || 1.0)}px`,
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))'
                      }}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  {/* Small tag/badge display name underneath characters when bubble is NOT active */}
                  {!isBubbleActive && (
                    <div className="mt-1 bg-black/70 border border-zinc-900 text-[8.5px] text-zinc-350 px-1.5 py-0.5 rounded-md font-mono shrink-0 font-bold whitespace-nowrap shadow tracking-wide leading-none select-none max-w-[100px] truncate">
                      {av.nickname}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .text-shadow {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8), 0 0 1px rgba(0, 0, 0, 0.5);
        }
        #chat-scroller::-webkit-scrollbar,
        #chat-overlay-root::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          background: transparent !important;
        }
        #chat-scroller,
        #chat-overlay-root {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
    </div>
  );
}
