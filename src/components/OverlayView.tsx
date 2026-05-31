/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Gift, UserPlus, Share2, Shield, Star, Award, WifiOff, Volume2 } from 'lucide-react';
import { ChatMessage, AlertEvent, OverlaySettings, OverlayTheme } from '../types';
import { soundSynth } from '../utils/audio';

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

export default function OverlayView({ settingsOverride, isDemo = false }: OverlayViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeAlert, setActiveAlert] = useState<AlertEvent | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const particleIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

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
      highlightKeywords: ['obs', 'indofinity', 'stream', 'highlight'],
      ignoredUsers: [],
      animationStyle: 'slide-up',
      testChannelName: 'IndoFinity Streamer'
    };

    // If we've got override parameters (from the Dashboard live-preview), use those
    if (settingsOverride) {
      return { ...defaultSettings, ...settingsOverride };
    }

    // Otherwise, parse query parameters for direct OBS overlay URL
    try {
      const parsed: OverlaySettings = {
        wsUrl: searchParams.get('wsUrl') || defaultSettings.wsUrl,
        theme: (searchParams.get('theme') as OverlayTheme) || defaultSettings.theme,
        fontSize: Number(searchParams.get('fontSize')) || defaultSettings.fontSize,
        maxMessages: Number(searchParams.get('maxMessages')) || defaultSettings.maxMessages,
        messageLifetime: searchParams.has('messageLifetime') ? Number(searchParams.get('messageLifetime')) : defaultSettings.messageLifetime,
        showAvatars: searchParams.get('showAvatars') !== 'false',
        showBadges: searchParams.get('showBadges') !== 'false',
        alertSounds: searchParams.get('alertSounds') !== 'false',
        textToSpeech: searchParams.get('textToSpeech') === 'true',
        ttsVoiceRate: Number(searchParams.get('ttsVoiceRate')) || defaultSettings.ttsVoiceRate,
        ttsVoicePitch: Number(searchParams.get('ttsVoicePitch')) || defaultSettings.ttsVoicePitch,
        highlightKeywords: searchParams.get('highlightKeywords')?.split(',') || defaultSettings.highlightKeywords,
        ignoredUsers: searchParams.get('ignoredUsers')?.split(',') || defaultSettings.ignoredUsers,
        animationStyle: (searchParams.get('animationStyle') as any) || defaultSettings.animationStyle,
        testChannelName: defaultSettings.testChannelName
      };
      return parsed;
    } catch {
      return defaultSettings;
    }
  }, [settingsOverride, window.location.search]);

  // Custom User colors mapping to keep username colors consistent in chat overlays
  const userColorsMap = useRef<Record<string, string>>({});
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

  // Sound triggering helper
  const triggerSound = (type: 'chat' | 'alert' | 'gift') => {
    if (!settings.alertSounds) return;
    if (type === 'chat') {
      soundSynth.playPop();
    } else if (type === 'gift') {
      soundSynth.playGiftCoin();
    } else {
      soundSynth.playAlertChime();
    }
  };

  // Text to speech engine
  const triggerTTS = (text: string) => {
    if (!settings.textToSpeech) return;
    try {
      window.speechSynthesis.cancel(); // Cancel active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.ttsVoiceRate;
      utterance.pitch = settings.ttsVoicePitch;
      // Search for Thai/English/Indonesian voice depending on text
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Simple heuristic: if most characters are non-ascii Thai/Indo, try to find a localized voice
        const isThai = /[\u0E00-\u0E7F]/.test(text);
        let selectedVoice = voices.find(v => isThai ? v.lang.startsWith('th') : v.lang.startsWith('en'));
        if (!selectedVoice) {
          // Fallback to active language preferences or first voice
          selectedVoice = voices.find(v => v.lang.startsWith('id')) || voices[0];
        }
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS vocalisation failed:', e);
    }
  };

  // Sparkle Burst Particle Generator
  const generateSparkleBurst = (x: number, y: number, theme: OverlayTheme) => {
    const newParticles: Particle[] = [];
    const colors = theme === 'cyberpunk' 
      ? ['#FF007F', '#00F0FF', '#FFF', '#9900FF'] 
      : theme === 'retro' 
        ? ['#00FF00', '#FFFF00', '#FF00FF', '#00FFFF']
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
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    const messageObj: ChatMessage = { ...newMessage, id, timestamp };

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
    } else {
      triggerSound('alert');
    }

    // 3. Trigger TTS if applicable
    if (messageObj.type === 'chat' && settings.textToSpeech && messageObj.comment) {
      triggerTTS(`${messageObj.nickname} says: ${messageObj.comment}`);
    } else if (messageObj.type === 'gift' && settings.textToSpeech) {
      triggerTTS(`${messageObj.nickname} sent a ${messageObj.giftName}!`);
    } else if (messageObj.type === 'follow' && settings.textToSpeech) {
      triggerTTS(`${messageObj.nickname} followed your stream!`);
    }

    // 4. Update core comments stack
    setMessages(prev => {
      const merged = [...prev, messageObj];
      if (merged.length > settings.maxMessages) {
        return merged.slice(merged.length - settings.maxMessages);
      }
      return merged;
    });

    // 5. Construct Visual Alert Banner for crucial events (Follow, Gift, Share, Like above 5x)
    if (messageObj.type !== 'chat') {
      let detailText = '';
      if (messageObj.type === 'gift') {
        detailText = `sent a ${messageObj.giftName} x${messageObj.repeatCount || 1}!`;
      } else if (messageObj.type === 'follow') {
        detailText = `is now following!`;
      } else if (messageObj.type === 'share') {
        detailText = `shared the stream!`;
      } else if (messageObj.type === 'like') {
        detailText = `liked the stream!`;
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
      generateSparkleBurst(window.innerWidth / 2, 80, settings.theme);
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

  // Alert Auto-Dismiss timer
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 4500); // Overlay banners persist 4.5 seconds

    return () => clearTimeout(timer);
  }, [activeAlert]);

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
          try {
            const message = JSON.parse(event.data);
            const { event: streamEvent, data: eventData } = message;

            console.log(`Event parsed: ${streamEvent}`, eventData);

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

  return (
    <div 
      className="fixed inset-0 overflow-hidden flex flex-col justify-end p-4 pointer-events-none select-none select-none z-50 bg-transparent"
      id="chat-overlay-root"
    >
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

      {/* Connection Failure Warn - purely in dashboard/early-view load, transparent in full stream unless wanted */}
      {!isDemo && wsStatus !== 'connected' && (
        <div className="absolute top-4 left-4 bg-red-950/90 border border-red-500/30 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 backdrop-blur-md pointer-events-auto max-w-sm z-30 transition-all">
          <WifiOff className="text-red-400 w-5 h-5 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <h4 className="text-[12px] font-bold text-red-200 uppercase tracking-widest font-mono">Connecting to stream...</h4>
            <p className="text-[11px] text-red-300/80 mt-0.5">Attempting server feed on: <code className="bg-red-900/40 px-1 py-0.5 rounded font-mono text-[10px] break-all">{settings.wsUrl}</code></p>
          </div>
        </div>
      )}

      {/* Top Center alert notifications banner overlay */}
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
                  <div className="bg-zinc-900 border border-zinc-800 p-2 text-indigo-400">
                    {activeAlert.type === 'gift' ? <Gift className="w-5 h-5 flex-shrink-0 animate-bounce" /> :
                     activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 flex-shrink-0" /> :
                     activeAlert.type === 'like' ? <Heart className="w-5 h-5 flex-shrink-0 fill-rose-500 text-rose-500" /> :
                     <Share2 className="w-5 h-5 flex-shrink-0" />}
                  </div>
                  <div>
                    <h5 className="font-mono text-zinc-400 uppercase text-[9px] tracking-widest font-extrabold">NEW EVENTS FEED</h5>
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
                  <div className="relative bg-pink-500/20 p-2.5 rounded border border-pink-500/40">
                    {activeAlert.type === 'gift' ? <Gift className="w-6 h-6 text-pink-500 flex-shrink-0" /> :
                     activeAlert.type === 'follow' ? <UserPlus className="w-6 h-6 text-cyan-400 flex-shrink-0" /> :
                     activeAlert.type === 'like' ? <Heart className="w-6 h-6 text-red-500 flex-shrink-0 fill-red-500" /> :
                     <Share2 className="w-6 h-6 text-lime-400 flex-shrink-0" />}
                  </div>
                  <div>
                    <h5 className="font-mono text-[#00F0FF] uppercase text-[11px] tracking-widest font-extrabold animate-pulse">ALERT RECEIVED</h5>
                    <p className="font-sans text-[13px] text-white font-medium mt-0.5">
                      <strong className="text-pink-500">@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'glassmorphism' && (
                <div className="bg-white/10 border border-white/20 backdrop-blur-lg px-6 py-4 rounded-2xl shadow-[0_8px_32px_0_rgba(255,255,255,0.08)] flex items-center gap-4 min-w-[320px]">
                  <div className="bg-white/15 p-2.5 rounded-full border border-white/10 backdrop-blur-md text-white">
                    {activeAlert.type === 'gift' ? <Gift className="w-5 h-5 flex-shrink-0" /> :
                     activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 flex-shrink-0" /> :
                     activeAlert.type === 'like' ? <Heart className="w-5 h-5 flex-shrink-0 fill-rose-400 text-rose-400" /> :
                     <Share2 className="w-5 h-5 flex-shrink-0" />}
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
                  <div className="p-2 bg-slate-900 rounded-lg text-amber-400">
                    {activeAlert.type === 'gift' ? <Gift className="w-5 h-5 flex-shrink-0" /> :
                     activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5 flex-shrink-0" /> :
                     activeAlert.type === 'like' ? <Heart className="w-5 h-5 flex-shrink-0 fill-amber-400" /> :
                     <Share2 className="w-5 h-5 flex-shrink-0" />}
                  </div>
                  <div>
                    <span className="text-[12px] font-bold text-slate-800 tracking-wider uppercase">NEW NOTIFICATION</span>
                    <p className="text-[14.5px] font-bold text-slate-950">
                      <strong>@{activeAlert.nickname}</strong> {activeAlert.detailText}
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'minimal' && (
                <div className="bg-black/80 backdrop-blur-md border border-neutral-700/50 px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3.5 min-w-[300px]">
                  {activeAlert.type === 'gift' ? <Gift className="w-4 h-4 text-yellow-400 flex-shrink-0" /> :
                   activeAlert.type === 'follow' ? <UserPlus className="w-4 h-4 text-blue-400 flex-shrink-0" /> :
                   activeAlert.type === 'like' ? <Heart className="w-4 h-4 text-green-400 flex-shrink-0" /> :
                   <Share2 className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                  <p className="text-[12px] text-white font-mono uppercase tracking-wide">
                    @{activeAlert.nickname} <span className="text-neutral-400">{activeAlert.detailText}</span>
                  </p>
                </div>
              )}

              {settings.theme === 'retro' && (
                <div className="bg-slate-950 border-4 border-lime-400 px-6 py-4 rounded-none shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center gap-4 min-w-[320px] font-mono">
                  <div className="bg-lime-950/20 border-2 border-lime-400 p-2 text-lime-400 animate-bounce">
                    {activeAlert.type === 'gift' ? <Gift className="w-5 h-5" /> :
                     activeAlert.type === 'follow' ? <UserPlus className="w-5 h-5" /> :
                     activeAlert.type === 'like' ? <Heart className="w-5 h-5 fill-lime-400" /> :
                     <Share2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="text-[10px] text-lime-400 font-extrabold uppercase animate-pulse">!ALERT SUCCESS!</h5>
                    <p className="text-[13px] text-white mt-1">
                      @{activeAlert.nickname.toUpperCase()} <span className="text-lime-300">{activeAlert.detailText.toUpperCase()}</span>
                    </p>
                  </div>
                </div>
              )}

              {settings.theme === 'twitch' && (
                <div className="bg-[#18181b] border-l-4 border-l-purple-500 px-5 py-3.5 rounded-sm shadow-2xl flex items-center gap-3.5 min-w-[320px]">
                  <div className="text-purple-400 bg-purple-950/30 p-2.5 rounded">
                    {activeAlert.type === 'gift' ? <Gift className="w-4 h-4 flex-shrink-0" /> :
                     activeAlert.type === 'follow' ? <UserPlus className="w-4 h-4 flex-shrink-0" /> :
                     activeAlert.type === 'like' ? <Heart className="w-4 h-4 flex-shrink-0 fill-purple-400" /> :
                     <Share2 className="w-4 h-4 flex-shrink-0" />}
                  </div>
                  <div>
                    <h5 className="text-[10px] text-purple-400 font-semibold tracking-wide uppercase">STREAM EVENT</h5>
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

      {/* Primary chat scroll container - bottom aligned */}
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
                            Sent {msg.giftName} <strong className="text-amber-400 text-[14px]">x{msg.repeatCount}</strong>!
                          </span>
                        </div>
                      ) : msg.type === 'follow' ? (
                        <span className="text-cyan-400 font-semibold flex items-center gap-1 py-0.5">
                          <UserPlus className="w-3.5 h-3.5 flex-shrink-0 inline" /> Followed the stream!
                        </span>
                      ) : msg.type === 'like' ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1 py-0.5">
                          <Heart className="w-3.5 h-3.5 flex-shrink-0 inline fill-rose-500 text-rose-500" /> Liked (x{msg.likeCount})!
                        </span>
                      ) : (
                        <span className="text-lime-400 font-semibold flex items-center gap-1 py-0.5">
                          <Share2 className="w-3.5 h-3.5 flex-shrink-0 inline" /> Shared the stream!
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
