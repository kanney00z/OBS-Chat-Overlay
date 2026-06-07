/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Settings, Sliders, Play, Laptop, Clipboard, Check, HelpCircle, 
  MessageSquare, Heart, Gift, UserPlus, Share2, Shield, Eye, EyeOff, Volume2, 
  VolumeX, RefreshCw, Sparkles, AlertCircle, Trash2, ArrowRight, Video, ListFilter, Image,
  Users, Trash, Crown, Clock, Bell, Target, Award, Swords
} from 'lucide-react';
import { OverlaySettings, OverlayTheme, ChatMessage } from '../types';
import OverlayView from './OverlayView';
import VectorAvatar from './VectorAvatar';

const PRESET_AVATARS = [
  { id: 'av_katak', name: 'Katak Ungu Putih (กบม่วงขาวอภิสิทธิ์)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjYxZDF6bzU2MmhkMDY1dmhwdTF5ZXByMnBtNTVlZG51MzhmeTF1bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/X3bZfO1fA9OOk/giphy.gif', scale: 1.1, premium: true },
  { id: 'av_c39', name: 'Cartoon 39 (พาสึกระโหลกคราม)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZTA4ZXpzem1nYTcweGFvNXJzNWZjcW8wdzM5YnYxeWxhN3J6cnlueCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/K7I7f4D2H23s8V6UeZ/giphy.gif', scale: 1.25, premium: true },
  { id: 'av_c38', name: 'Cartoon 38 (อัศวินเขาปีศาจแดง)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHhwdWtwZmR2Z25uMTNmaXFpdmNoMncwNGxpaDlxMnltajRzdmoydSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/rX7Xto0gW9GgS3mHjR/giphy.gif', scale: 1.2, premium: true },
  { id: 'av_c37', name: 'Cartoon 37 (นินจาชุดฟ้าพลังเวทย์)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTZreHN2bXg2cmJhZHFhYnRjNXg1azlyZXhwbGRpajgwcG1yeXh2NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/v3K3Wb9SArQfL8f9Xz/giphy.gif', scale: 1.15, premium: true },
  { id: 'av_c36', name: 'Cartoon 36 (หนุ่มแก็ปผจญภัย)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDVjY3JzajhxYThqYnpqbDloZmdpdXBncnk4a243dThreG5uNGptMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/B0tXe11K0D5MlwC7Yd/giphy.gif', scale: 1.1, premium: true },
  { id: 'av_c35', name: 'Cartoon 35 (เชฟจิ๋วขี้โมโห)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmt6czVpYWNjbnEyaGdyNXN0ZWwybm4yc3drZHBrZ3Y5d2psMGlyZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Stf3I35y7yC0bA88A4/giphy.gif', scale: 1.15, premium: true },
  { id: 'av_c34', name: 'Cartoon 34 (นินจากระโดดวายุ)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3p4dXVsdHVzd2dxcDJyeHpmenRzdTB3ZXhheXR2cXZqMXpjczg4YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/gQRrxoX01JNjW/giphy.gif', scale: 1.2, premium: true },
  { id: 'av_c33', name: 'Cartoon 33 (ตัวตลกสายฮาพิกเซล)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWJpMXM3bmRxMmNxdDNoejMxbzVxZXR4Zm8xd2E0MTF3MGF1cnlpdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wf0G9vH7788P7uof5B/giphy.gif', scale: 1.1, premium: true },
  { id: 'av_c32', name: 'Cartoon 32 (จอมยุทธ์หน้ากากทอง)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWdvdGZ5dnA4ejN3NjAyamVsc3NoZTNnaTNreml6dWphMmVhbGVrYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/9t7q2V6Y9Ylqf8pD/giphy.gif', scale: 1.15, premium: true },
  { id: 'av_c30', name: 'Cartoon 30 (เอลฟ์ผู้พิทักษ์ป่า)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnd2NzBzN3F4dHBycWdwOGg4d3N4enEwaTR4d3gyOXhmdjBtc29yZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/p6K078jR4lWpP0mXm9/giphy.gif', scale: 1.1, premium: true },
  { id: 'av_c29', name: 'Cartoon 29 (หนูหมวกแมวสุดซ่า)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3h2cjhsMzQ3NHp1dGl0eDRoNzM5N2gwdDF4MG8zNTB5cTRrcjRkdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/mB9v7q2V6Y9Ylqf8pD/giphy.gif', scale: 1.2, premium: true },
  { id: 'av_c21', name: 'Cartoon 21 (จอมเวทย์เสื้อคลุมม่วง)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZndWUzOGdveDVkaHMyMWF3aGtwMWpzbTRtcTloNDBvd3B0OWpxciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/8m4R3Y9F83Fi79U93R/giphy.gif', scale: 1.25, premium: true },
  { id: 'av_c15', name: 'Cartoon 15 (สไลม์นักรบสีชมพู)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTlkMHltNjFrM3IwbWdtNGUzbHFuNWE5bWtsbzd0NGpsNmpudmJrNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/v8S7f8pIpxNfB84Bst/giphy.gif', scale: 1.1, premium: true },
  { id: 'av_c14', name: 'Cartoon 14 (วิญญาณสวมหมวกไหมพรม)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3N5b2dwNnY4Zmp2ODg3c25tdTZubDBsbWNrcm81N3pwanJhNTlkayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/L33yPCtQCr48yOtbO4/giphy.gif', scale: 1.1, premium: true },
  { id: 'av_c2', name: 'Cartoon 2 (สุนัขจิ้งจอกนักซิ่ง)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWZvdDV2MTYyYW8wODBpaXJ3dzNhZmdtZzh6dmowMTdtN2NiaHJ6MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/X83uO7S2xZkFfE2m6I/giphy.gif', scale: 1.15, premium: true },
  { id: 'av_c1', name: 'Cartoon 1 (นินจาสายลมเงาหมอก)', spriteUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmt6czVpYWNjbnEyaGdyNXN0ZWwybm4yc3drZHBrZ3Y5d2psMGlyZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/u0S2bXpE0vH2r5M17W/giphy.gif', scale: 1.1, premium: true }
];

const VECTOR_PRESET_AVATARS = [
  { id: 'vec_slime', name: 'สไลม์เจลลี่ดึ๋งดั๋ง (Pink Jelly Slime)', spriteUrl: 'vector:slime', scale: 1.15, premium: true },
  { id: 'vec_robot', name: 'หุ่นยนต์ไซเบอร์บอท (Cyber Robot LED)', spriteUrl: 'vector:robot', scale: 1.15, premium: true },
  { id: 'vec_ninja', name: 'นินจาเงาวายุสะกดชีพ (Shadow Ninja Cyan)', spriteUrl: 'vector:ninja', scale: 1.15, premium: true },
  { id: 'vec_kitten', name: 'ลูกแมวเหมียวสามสีแสนซน (Playful Kitten)', spriteUrl: 'vector:kitten', scale: 1.15, premium: true },
  { id: 'vec_wizard', name: 'จอมเวทมนตร์อวตาร (Arcane Wizard staff)', spriteUrl: 'vector:wizard', scale: 1.1, premium: true },
  { id: 'vec_ghost', name: 'ผีวิญญาณน้อยขี้อ้อน (Sweet Ghost wave)', spriteUrl: 'vector:ghost', scale: 1.15, premium: true }
];

const DEFAULT_AVATARS = [
  ...VECTOR_PRESET_AVATARS,
  ...PRESET_AVATARS.slice(0, 4)
];

const WIDGETS_LIST = [
  {
    id: 'donate_alert',
    title_en: 'Donate Alert',
    title_th: 'แจ้งเตือนการโดเนท (Alerts Only)',
    desc: 'เครื่องมือป๊อปอัพแจ้งเตือนเมื่อเกิดกิจกรรมการสนับสนุน โดเนทไอเท็ม และกดติดตามบนหน้าจอ',
    color: 'blue',
    mode: 'alerts_only',
    icon_type: 'bell',
    category: 'alerts'
  },
  {
    id: 'donate_goal',
    title_en: 'Donate Goal',
    title_th: 'หลอดเป้าหมายยอดโดเนท',
    desc: 'บาร์กระตุ้นพลังงานแสดงเป้าหมายยอดสนับสนุนเป้าหมายจำลองสำหรับตกแต่งช่องสตรีม',
    color: 'red',
    mode: 'donate_goal',
    icon_type: 'target',
    category: 'stats'
  },
  {
    id: 'leaderboard',
    title_en: 'Leaderboard',
    title_th: 'จัดอันดับผู้สนับสนุนสูงสุด',
    desc: 'ป้ายกระดานจำลองสรุกผู้มียอดโดเนทและส่งของขวัญสูงสุดประจำวัน/สัปดาห์ในไลฟ์',
    color: 'orange',
    mode: 'leaderboard',
    icon_type: 'award',
    category: 'stats'
  },
  {
    id: 'top_donate',
    title_en: 'Top Donate',
    title_th: 'แก้วสมทบสะสมแต้มหัวใจ',
    desc: 'แก้วจำลองฟิสิกส์กักเก็บทุกเม็ดสติกเกอร์หัวใจ แฟนฟีเวอร์ และการรัวไลก์',
    color: 'yellow',
    mode: 'hearts_glass',
    icon_type: 'crown',
    category: 'stats'
  },
  {
    id: 'recent_donate',
    title_en: 'Recent Donate',
    title_th: 'ประวัติและคอมเมนต์แชทสตรีม',
    desc: 'กล่องคอมเมนต์แชทกระเตื้องสรุปกิจกรรมแชทรวมและเหตุการณ์แจ้งเตือนตกแต่งไลฟ์',
    color: 'purple',
    mode: 'chat_alerts',
    icon_type: 'clock',
    category: 'interactive'
  },
  {
    id: 'gift_alert',
    title_en: 'Gift Alert',
    title_th: 'แจ้งเตือนเอฟเฟกต์รูปภาพ',
    desc: 'กรองป๊อปอัพโชว์รูปภาพขวัญพิเศษ อิมเมจลิงก์ที่ผู้ชมส่งโต้ตอบพร้อมมีตติ้งยักษ์',
    color: 'pink',
    mode: 'images_only',
    icon_type: 'gift',
    category: 'alerts'
  },
  {
    id: 'donate_timer',
    title_en: 'Donate Timer',
    title_th: 'ตัวนับถอยหลังสตรีมเวลามันส์',
    desc: 'นวัตกรรมระบบนาฬิกาสมาร์ทรองรับแชทบวกลบเวลาสตรีมจากผู้ชมไลฟ์สดโดยตรง',
    color: 'cyan',
    mode: 'timer_only',
    icon_type: 'stopwatch',
    isNew: true,
    category: 'interactive'
  },
  {
    id: 'live_battle',
    title_en: 'Live Battle',
    title_th: 'บอสเกมและแชทอวตารเดินสู้',
    desc: 'ห้องรวมภาพอนิเมชันจำลองกองทัพอวตารผู้ชมแชทวิ่งเล่นคุยและกระโดดป่วนเต็มบนหน้าจอ',
    color: 'green',
    mode: 'avatars',
    icon_type: 'swords',
    category: 'interactive'
  }
];

export default function DashboardView() {
  const [settings, setSettings] = useState<OverlaySettings>(() => {
    const saved = localStorage.getItem('obs_overlay_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          wsUrl: 'ws://localhost:62024',
          theme: 'geometric',
          fontSize: 16,
          maxMessages: 10,
          messageLifetime: 20,
          showAvatars: true,
          showBadges: true,
          alertSounds: true,
          textToSpeech: false,
          ttsVoiceRate: 1.0,
          ttsVoicePitch: 1.0,
          ttsEngine: 'google',
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
          customAvatars: DEFAULT_AVATARS,
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
          timerFontSize: 48,
          ...parsed
        };
      } catch (e) {
        // Fallback below
      }
    }
    return {
      wsUrl: 'ws://localhost:62024',
      theme: 'geometric',
      fontSize: 16,
      maxMessages: 10,
      messageLifetime: 20,
      showAvatars: true,
      showBadges: true,
      alertSounds: true,
      textToSpeech: false,
      ttsVoiceRate: 1.0,
      ttsVoicePitch: 1.0,
      ttsEngine: 'google',
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
      customAvatars: DEFAULT_AVATARS,
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
  });

  // Track settings changes in real-time and save to localStorage
  useEffect(() => {
    localStorage.setItem('obs_overlay_settings', JSON.stringify(settings));
  }, [settings]);

  // Load custom selected font dynamically on the Dashboard too for clean local settings preview!
  useEffect(() => {
    if (settings.fontFamily) {
      try {
        const linkId = 'custom-google-font-dashboard-stylesheet';
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
        console.warn('Failed to load Google Font on dashboard:', err);
      }
    }
  }, [settings.fontFamily]);

  // Handle URL synchronizing, so even if the browser is reloaded or links generated, they stay synchronized
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hasOverlay = searchParams.get('overlay') === 'true';
    if (!hasOverlay) {
      // If we are in DashboardView, check if there are custom config state parameters
      // (This updates states if the user comes back with pre-saved/bookmarked options)
      const themeParam = searchParams.get('theme');
      if (themeParam && themeParam !== settings.theme) {
        setSettings(prev => ({
          ...prev,
          theme: themeParam as any
        }));
      }
    }
  }, []);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const list = window.speechSynthesis.getVoices();
        setVoices(list);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const [copiedChat, setCopiedChat] = useState(false);
  const [copiedChatOnly, setCopiedChatOnly] = useState(false);
  const [copiedAlertsOnly, setCopiedAlertsOnly] = useState(false);
  const [copiedImages, setCopiedImages] = useState(false);
  const [copiedAvatars, setCopiedAvatars] = useState(false);
  const [copiedHearts, setCopiedHearts] = useState(false);
  const [copiedTimer, setCopiedTimer] = useState(false);
  const [backgroundType, setBackgroundType] = useState<'checkerboard' | 'game' | 'dark' | 'green'>('game');
  const [customComment, setCustomComment] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [ignoreInput, setIgnoreInput] = useState('');
  
  // Custom states for adding own avatars
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newAvatarScale, setNewAvatarScale] = useState(1.0);
  
  const [activeTab, setActiveTab] = useState<'widgets' | 'general' | 'design' | 'avatars' | 'audio' | 'filter'>('widgets');
  const [currentPage, setCurrentPage] = useState<'widgets' | 'history' | 'withdraw' | 'integrations'>('widgets');
  const [withdrawAmount, setWithdrawAmount] = useState('2500');
  const [withdrawPhone, setWithdrawPhone] = useState('089-123-4567');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'alerts' | 'stats' | 'interactive'>('all');
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);

  const [dbTimerLeft, setDbTimerLeft] = useState<number>(300);
  const [dbTimerActive, setDbTimerActive] = useState<boolean>(false);

  // Keep track of master timer state from the server for smooth client-side interpolation
  const dbTimerSyncRef = useRef<{
    serverSeconds: number;
    serverActive: boolean;
    localTimeOfFetch: number;
  }>({
    serverSeconds: 300,
    serverActive: false,
    localTimeOfFetch: Date.now(),
  });

  // Sync countdown timer state on the Dashboard periodically with server
  useEffect(() => {
    let syncInterval: any;
    let tickInterval: any;

    const fetchTimerState = async () => {
      try {
        const res = await fetch('/api/timer');
        if (res.ok) {
          const data = await res.json();
          dbTimerSyncRef.current = {
            serverSeconds: data.secondsRemaining,
            serverActive: data.isActive,
            localTimeOfFetch: Date.now()
          };
          setDbTimerActive(data.isActive);
        }
      } catch (err) {
        console.warn('Failed to fetch timer on dashboard:', err);
      }
    };

    fetchTimerState();
    syncInterval = setInterval(fetchTimerState, 1200);

    // Keep counting down locally at high speed for perfectly smooth visual output
    tickInterval = setInterval(() => {
      const { serverSeconds, serverActive, localTimeOfFetch } = dbTimerSyncRef.current;
      if (serverActive) {
        const elapsedSinceFetch = (Date.now() - localTimeOfFetch) / 1000;
        const computedSeconds = Math.max(0, serverSeconds - elapsedSinceFetch);
        setDbTimerLeft(computedSeconds);
      } else {
        setDbTimerLeft(serverSeconds);
      }
    }, 100);

    return () => {
      clearInterval(syncInterval);
      clearInterval(tickInterval);
    };
  }, []);

  // Helper to send actions (+time, -time, play, pause, reset) to Express server
  const sendTimerAction = async (action: string, seconds?: number) => {
    try {
      const res = await fetch('/api/timer/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, seconds })
      });
      if (res.ok) {
        const data = await res.json();
        dbTimerSyncRef.current = {
          serverSeconds: data.secondsRemaining,
          serverActive: data.isActive,
          localTimeOfFetch: Date.now()
        };
        setDbTimerLeft(data.secondsRemaining);
        setDbTimerActive(data.isActive);
      }
    } catch (err) {
      console.error('Failed to post timer action:', err);
    }
  };
  const [marketplaceTab, setMarketplaceTab] = useState<'vector' | 'classic'>('vector');

  const addCustomAvatar = (name: string, spriteUrl: string, scale: number) => {
    if (!name.trim() || !spriteUrl.trim()) return;
    const newAvatar = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      spriteUrl: spriteUrl.trim(),
      scale: numberValue(scale, 1.0)
    };
    setSettings(prev => ({
      ...prev,
      customAvatars: [...(prev.customAvatars || DEFAULT_AVATARS), newAvatar]
    }));
  };

  const deleteCustomAvatar = (id: string) => {
    setSettings(prev => ({
      ...prev,
      customAvatars: (prev.customAvatars || DEFAULT_AVATARS).filter(av => av.id !== id)
    }));
  };

  const resetCustomAvatars = () => {
    setSettings(prev => ({
      ...prev,
      customAvatars: DEFAULT_AVATARS
    }));
  };

  const numberValue = (val: any, fallback: number): number => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Multi-lingual stream simulation payloads
  const mockComments = [
    { name: 'Sutopo_Gamer', text: 'สวัสดีครับทุกคนนน! ช่องนี้สตรีมดีมากๆ 👍', isMod: false, isSub: true },
    { name: 'Aninda_Putri', text: 'โอเวอร์เลย์สวยมากเลยครับ! ระบบเชื่อมต่อได้ลื่นไหลสุดๆ 🔥', isMod: true, isSub: true },
    { name: 'GamerX_In', text: 'เลเวลเท่าไหร่แล้วครับ ขอแจมเล่นด้วยได้ไหม?', isMod: false, isSub: false },
    { name: 'Somsak_Live', text: 'สุดยอดดด! ช่วยแนะนำตั้งค่าโปรแกรมสตรีมหน่อยครับ', isMod: false, isSub: true },
    { name: 'Rian_Finity', text: 'ข้อความทดสอบลองใช้คำไฮไลท์ตรวจสอบระบบคีย์เวิร์ด OBS ครับ', isMod: false, isSub: false, isVip: true },
    { name: 'Aom_Pitch', text: 'แวะมาส่งของขวัญและกำลังใจให้คร้าบ วันนี้มีกิจกรรมอะไรไหมนะ 🥰', isMod: true, isSub: false },
    { name: 'Budi_Santoso', text: 'ขอให้สตรีมปังๆ ร่ำรวยๆ นะครับพี่! โอเวอร์เลย์สวยเท่จัดเลย 🚀', isMod: false, isSub: true }
  ];

  const mockAvatarUrls = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop&q=80'
  ];

  const mockGifts = [
    { name: 'ดอกกุหลาบ', icon: '🌹', val: 10, pfp: mockAvatarUrls[0] },
    { name: 'หัวใจวิบวับ', icon: '💖', val: 50, pfp: mockAvatarUrls[1] },
    { name: 'แก้วกาแฟ', icon: '☕', val: 99, pfp: mockAvatarUrls[2] },
    { name: 'มงกุฎเพชร', icon: '👑', val: 499, pfp: mockAvatarUrls[3] },
    { name: 'ยานอวกาศยูนิเวิร์ส', icon: '🚀', val: 1000, pfp: mockAvatarUrls[4] }
  ];

  // Helper to build a clean overlay URL with custom override parameter
  const buildOverlayUrl = (mode: 'chat_alerts' | 'images_only' | 'chat_only' | 'alerts_only' | 'avatars' | 'hearts_glass' | 'timer_only' | 'donate_goal' | 'leaderboard') => {
    const base = window.location.origin;
    const params = new URLSearchParams();
    
    params.set('overlay', 'true');
    params.set('mode', mode);
    params.set('wsUrl', settings.wsUrl);
    params.set('theme', settings.theme);
    params.set('fontSize', settings.fontSize.toString());
    params.set('maxMessages', settings.maxMessages.toString());
    params.set('messageLifetime', settings.messageLifetime.toString());
    params.set('showAvatars', settings.showAvatars.toString());
    params.set('showBadges', settings.showBadges.toString());
    params.set('alertSounds', settings.alertSounds.toString());
    params.set('textToSpeech', settings.textToSpeech.toString());
    params.set('ttsVoiceRate', settings.ttsVoiceRate.toString());
    params.set('ttsVoicePitch', settings.ttsVoicePitch.toString());
    if (settings.ttsVoiceName) {
      params.set('ttsVoiceName', settings.ttsVoiceName);
    }
    if (settings.ttsEngine) {
      params.set('ttsEngine', settings.ttsEngine);
    }
    params.set('ttsReadChat', (settings.ttsReadChat !== false).toString());
    params.set('ttsReadGift', (settings.ttsReadGift !== false).toString());
    params.set('ttsReadFollow', (settings.ttsReadFollow !== false).toString());
    params.set('ttsReadShareImage', (settings.ttsReadShareImage !== false).toString());
    params.set('ttsSkipNickname', (settings.ttsSkipNickname ?? false).toString());
    params.set('animationStyle', settings.animationStyle);
    params.set('showImageAlerts', (settings.showImageAlerts !== false).toString());
    params.set('vectorAvatarSpeed', (settings.vectorAvatarSpeed ?? 1.0).toString());
    params.set('hideAvatarsWhenNoViewers', (settings.hideAvatarsWhenNoViewers ?? false).toString());
    params.set('testViewerCount', (settings.testViewerCount ?? 1).toString());
    params.set('hideWhenIdle', (settings.hideWhenIdle ?? true).toString());
    params.set('idleTimeout', (settings.idleTimeout ?? 60).toString());
    params.set('spawnOnlyOnActivity', (settings.spawnOnlyOnActivity ?? true).toString());
    params.set('showWalkingAvatars', (settings.showWalkingAvatars !== false).toString());
    params.set('maxVisitorAvatars', (settings.maxVisitorAvatars ?? 1).toString());
    params.set('glassType', settings.glassType || 'beer');
    if (settings.fontFamily) {
      params.set('fontFamily', settings.fontFamily);
    }
    params.set('showTimer', (settings.showTimer ?? false).toString());
    params.set('timerDuration', (settings.timerDuration ?? 300).toString());
    params.set('timerPosition', settings.timerPosition || 'top-left');
    params.set('timerOnlyNumbers', (settings.timerOnlyNumbers ?? false).toString());
    params.set('timerGlowColor', settings.timerGlowColor || 'cyan');
    params.set('timerFontSize', (settings.timerFontSize ?? 48).toString());
    
    if (settings.highlightKeywords.length > 0) {
      params.set('highlightKeywords', settings.highlightKeywords.join(','));
    }
    if (settings.ignoredUsers.length > 0) {
      params.set('ignoredUsers', settings.ignoredUsers.join(','));
    }

    return `${base}/?${params.toString()}`;
  };

  const chatAlertsOverlayUrl = buildOverlayUrl('chat_alerts');
  const chatOnlyOverlayUrl = buildOverlayUrl('chat_only');
  const alertsOnlyOverlayUrl = buildOverlayUrl('alerts_only');
  const imagesOnlyOverlayUrl = buildOverlayUrl('images_only');
  const avatarsOnlyOverlayUrl = buildOverlayUrl('avatars');
  const heartsGlassOverlayUrl = buildOverlayUrl('hearts_glass');
  const timerOnlyOverlayUrl = buildOverlayUrl('timer_only');
  const donateGoalOverlayUrl = buildOverlayUrl('donate_goal');
  const leaderboardOverlayUrl = buildOverlayUrl('leaderboard');

  const copyChatToClipboard = () => {
    navigator.clipboard.writeText(chatAlertsOverlayUrl);
    setCopiedChat(true);
    setTimeout(() => setCopiedChat(false), 3000);
  };

  const copyChatOnlyToClipboard = () => {
    navigator.clipboard.writeText(chatOnlyOverlayUrl);
    setCopiedChatOnly(true);
    setTimeout(() => setCopiedChatOnly(false), 3000);
  };

  const copyAlertsOnlyToClipboard = () => {
    navigator.clipboard.writeText(alertsOnlyOverlayUrl);
    setCopiedAlertsOnly(true);
    setTimeout(() => setCopiedAlertsOnly(false), 3000);
  };

  const copyImagesToClipboard = () => {
    navigator.clipboard.writeText(imagesOnlyOverlayUrl);
    setCopiedImages(true);
    setTimeout(() => setCopiedImages(false), 3000);
  };

  const copyAvatarsToClipboard = () => {
    navigator.clipboard.writeText(avatarsOnlyOverlayUrl);
    setCopiedAvatars(true);
    setTimeout(() => setCopiedAvatars(false), 3000);
  };

  const copyHeartsToClipboard = () => {
    navigator.clipboard.writeText(heartsGlassOverlayUrl);
    setCopiedHearts(true);
    setTimeout(() => setCopiedHearts(false), 3000);
  };

  const copyTimerToClipboard = () => {
    navigator.clipboard.writeText(timerOnlyOverlayUrl);
    setCopiedTimer(true);
    setTimeout(() => setCopiedTimer(false), 3000);
  };

  // Chat Simulator Trigger functions sending events via browser dispatch listeners
  const sendSimulatedEvent = (payload: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const customEvent = new CustomEvent('simulated-chat-overlay-event', {
      detail: payload
    });
    window.dispatchEvent(customEvent);
  };

  const simulateChat = (isMod = false) => {
    const pool = mockComments.filter(msg => isMod ? msg.isMod : true);
    const item = pool[Math.floor(Math.random() * pool.length)];
    const randomAvatar = mockAvatarUrls[Math.floor(Math.random() * mockAvatarUrls.length)];
    
    sendSimulatedEvent({
      type: 'chat',
      uniqueId: item.name.toLowerCase(),
      nickname: item.name,
      comment: item.text,
      profilePictureUrl: settings.showAvatars ? randomAvatar : undefined,
      isModerator: isMod || item.isMod,
      isSubscriber: !isMod && item.isSub,
      isVip: (item as any).isVip || false
    });
  };

  const simulateCustomComment = () => {
    if (!customComment.trim()) return;
    const randomAvatar = mockAvatarUrls[Math.floor(Math.random() * mockAvatarUrls.length)];
    sendSimulatedEvent({
      type: 'chat',
      uniqueId: 'streamer_buddy',
      nickname: settings.testChannelName,
      comment: customComment,
      profilePictureUrl: settings.showAvatars ? randomAvatar : undefined,
      isModerator: true,
      isSubscriber: true
    });
    setCustomComment('');
  };

  const simulateGift = () => {
    const gift = mockGifts[Math.floor(Math.random() * mockGifts.length)];
    const repeat = Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : 1;
    
    sendSimulatedEvent({
      type: 'gift',
      uniqueId: 'test_gifter',
      nickname: 'สายเปย์หรอยแรง',
      profilePictureUrl: settings.showAvatars ? gift.pfp : undefined,
      giftName: gift.name,
      repeatCount: repeat,
      diamondCount: gift.val * repeat,
      isSubscriber: true
    });
  };

  const simulateFollow = () => {
    const randomIdx = Math.floor(Math.random() * mockAvatarUrls.length);
    sendSimulatedEvent({
      type: 'follow',
      uniqueId: 'test_follower',
      nickname: 'ผู้ติดตามใหม่',
      profilePictureUrl: settings.showAvatars ? mockAvatarUrls[randomIdx] : undefined
    });
  };

  const simulateLike = () => {
    const randomIdx = Math.floor(Math.random() * mockAvatarUrls.length);
    sendSimulatedEvent({
      type: 'like',
      uniqueId: 'test_liker',
      nickname: 'แฟนตัวยง',
      profilePictureUrl: settings.showAvatars ? mockAvatarUrls[randomIdx] : undefined,
      likeCount: Math.floor(Math.random() * 12) + 1
    });
  };

  const simulateShare = () => {
    const randomIdx = Math.floor(Math.random() * mockAvatarUrls.length);
    sendSimulatedEvent({
      type: 'share',
      uniqueId: 'test_sharer',
      nickname: 'คนช่วยแชร์',
      profilePictureUrl: settings.showAvatars ? mockAvatarUrls[randomIdx] : undefined
    });
  };

  const mockSharedImages = [
    'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472214222541-d510753a4707?w=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&fit=crop&q=80'
  ];

  const simulateSendImage = () => {
    const randomImgIdx = Math.floor(Math.random() * mockSharedImages.length);
    const randomAvatarIdx = Math.floor(Math.random() * mockAvatarUrls.length);
    const names = ['Art_Lover_99', 'Camera_Guy', 'Meme_Master', 'NatureExplorer', 'CoolPhotoFan', 'PixelWizard'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const thoughts = [
      'ฝากรูปนี้ให้สตรีมเมอร์ดูหน่อยครับ สวยไหม! 🖼️✨',
      'แมวที่บ้านผมน่ารักไหมครับพี่สตรีมเมอร์ 🐾📸',
      'เพิ่งไปเที่ยวถ่ายรูปนี้มา สวยสดชื่นจริงๆ เลยครับ ⛰️☀️',
      'เจอมุกรูปนี้มา ขำกลิ้ง ตลกจัดๆ เลยเอามาแชร์ ฮ่าๆ 😆',
      'งานอาร์ตชิ้นโปรดอันใหม่ที่วาดเสร็จเมื่อคืนครับผม! ✏️🎨',
      'เอาภาพสวยๆ มาสร้างบรรยากาศห้องสตรีมให้นะค้าบ 🎉'
    ];
    const randomComment = thoughts[Math.floor(Math.random() * thoughts.length)];
    
    sendSimulatedEvent({
      type: 'share_image',
      uniqueId: randomName.toLowerCase(),
      nickname: randomName,
      comment: randomComment,
      profilePictureUrl: settings.showAvatars ? mockAvatarUrls[randomAvatarIdx] : undefined,
      imageUrl: mockSharedImages[randomImgIdx],
      isSubscriber: Math.random() > 0.4
    });
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    if (!settings.highlightKeywords.includes(keywordInput.toLowerCase())) {
      setSettings(prev => ({
        ...prev,
        highlightKeywords: [...prev.highlightKeywords, keywordInput.trim().toLowerCase()]
      }));
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setSettings(prev => ({
      ...prev,
      highlightKeywords: prev.highlightKeywords.filter(k => k !== kw)
    }));
  };

  const handleAddIgnored = () => {
    if (!ignoreInput.trim()) return;
    if (!settings.ignoredUsers.includes(ignoreInput.toLowerCase())) {
      setSettings(prev => ({
        ...prev,
        ignoredUsers: [...prev.ignoredUsers, ignoreInput.trim().toLowerCase()]
      }));
    }
    setIgnoreInput('');
  };

  const handleRemoveIgnored = (user: string) => {
    setSettings(prev => ({
      ...prev,
      ignoredUsers: prev.ignoredUsers.filter(u => u !== user)
    }));
  };

  return (
    <div className="min-h-screen bg-[#060608] text-[#e2e2e7] flex font-sans select-none overflow-hidden" id="easy-donate-dashboard">
      
      {/* 1. EASYDONATE-STYLE SIDEBAR NAVIGATION */}
      <aside className="w-[260px] bg-[#0c0c0f] border-r border-[#1a1a24] flex flex-col justify-between shrink-0 hidden md:flex font-sans">
        <div className="flex flex-col">
          {/* Header/Logo */}
          <div className="px-5 py-[18px] border-b border-[#13131a] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-tr from-[#7c3aed] to-cyan-400 p-2 rounded-xl text-white shadow-[0_0_15px_rgba(124,58,237,0.35)]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wider text-white font-mono flex items-center gap-1">
                  EASY<span className="text-cyan-400 font-extrabold text-xs">DONATE</span>
                </h2>
                <p className="text-[10px] text-zinc-500 font-medium tracking-tight">Creator Console v2.5</p>
              </div>
            </div>
            <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">PRO</span>
          </div>

          {/* User Profile Overview */}
          <div className="p-3 mx-3 my-4 bg-gradient-to-b from-[#111116] to-[#07070a] border border-[#161622] rounded-xl flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-cyan-500/30 bg-indigo-950 p-0.5 shadow-md">
                <img src={mockAvatarUrls[0]} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0c0c0f] rounded-full"></span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-zinc-200 truncate">Lantat_Streamer</h4>
              <p className="text-[9px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                ● สตรีมออนไลน์อยู่
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-2.5 space-y-1">
            {[
              { id: 'widgets', title: 'ตัวจัดการวิดเจ็ตสตรีม', icon: Laptop, badge: '6' },
              { id: 'history', title: 'ประวัติโดเนท & สนับสนุน', icon: ListFilter, badge: '7' },
              { id: 'withdraw', title: 'การถอนรายได้ & บัญชี', icon: Gift, badge: '฿15K' },
              { id: 'integrations', title: 'เชื่อมต่อระบบสตรีม', icon: Settings, badge: 'HOT' }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 transition-all rounded-lg text-xs font-medium cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#7c3aed]/15 to-[#3b82f6]/5 text-white border-l-4 border-[#7c3aed] font-semibold pl-4 shadow-sm' 
                      : 'text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/40 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#7c3aed]' : 'text-zinc-500'}`} />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 font-bold font-mono rounded ${
                      isActive ? 'bg-[#7c3aed]/20 text-[#a78bfa]' : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#13131a] bg-[#0c0c0f]">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>เซิร์ฟเวอร์หลัก: ไทย</span>
            <span className="text-emerald-500 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 99.9%
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-grow flex flex-col overflow-hidden h-screen bg-[#07070a]">
        
        {/* PREMIUM TOP HEADER BAR */}
        <header className="border-b border-[#14141e] bg-[#0c0c0f]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-xs shrink-0 z-10 font-sans">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              {currentPage === 'widgets' && '🔌 ตัวจัดการคลังวิดเจ็ตสตรีม OBS'}
              {currentPage === 'history' && '📊 รายงานประวัติการส่งสนับสนุนล่าสุด'}
              {currentPage === 'withdraw' && '💸 แดชบอร์ดรายได้และการถอนเงิน'}
              {currentPage === 'integrations' && '⚙️ ตั้งค่าเชื่อมต่อระบบไลฟ์สตรีมเมอร์'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet Quick Balance badge */}
            <div 
              onClick={() => setCurrentPage('withdraw')}
              className="hidden sm:flex items-center gap-3 bg-[#111117] hover:bg-[#161622] transition-colors border border-[#1b1b2a] px-3.5 py-1 rounded-xl cursor-pointer"
            >
              <div className="bg-[#7c3aed]/10 p-1.5 rounded-lg">
                <Gift className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              </div>
              <div className="text-left">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider leading-none">ยอดสะสมถอนได้</span>
                <span className="text-xs font-black text-white font-mono tracking-wide leading-none">฿15,250.00</span>
              </div>
              <button className="bg-[#7c3aed] text-white hover:bg-[#6d28d9] px-2 py-1 rounded text-[9px] font-bold font-sans">
                ถอนรายได้
              </button>
            </div>

            {/* Quick Status Indicator */}
            <div className="flex items-center gap-3 bg-[#111116] border border-[#161624] px-4 py-2 rounded-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-zinc-300 font-mono tracking-tight font-bold uppercase">ระบบพร้อมใช้งาน</span>
            </div>
          </div>
        </header>

        {/* 3. CORE PAGE SWITCHER AREA */}
        <div className="flex-grow overflow-hidden relative">
          
          {currentPage === 'widgets' ? (
            <div className="w-full h-full grid grid-cols-1 xl:grid-cols-12 xl:overflow-hidden overflow-y-auto">
        {/* Left column config workspace (Span 4) */}
        <section className="xl:col-span-4 border-r border-zinc-900 bg-zinc-950/40 flex flex-col h-auto xl:h-full overflow-hidden">
          {/* Tabs for settings */}
          <div className="grid grid-cols-2 gap-1.5 p-3.5 border-b border-[#14141f] shrink-0 bg-[#0c0c11]/90 select-none">
            <button 
              onClick={() => setActiveTab('widgets')}
              className={`px-2.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 border ${
                activeTab === 'widgets' 
                  ? 'bg-cyan-950/45 text-cyan-400 border-cyan-800/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#111117] border-transparent'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> วิดเจ็ต OBS
            </button>
            <button 
              onClick={() => setActiveTab('general')}
              className={`px-2.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 border ${
                activeTab === 'general' 
                  ? 'bg-indigo-950/45 text-indigo-400 border-indigo-800/30' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#111117] border-transparent'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> แคมเปญ
            </button>
            <button 
              onClick={() => setActiveTab('design')}
              className={`px-2.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 border ${
                activeTab === 'design' 
                  ? 'bg-purple-950/45 text-purple-400 border-purple-800/30' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#111117] border-transparent'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> ธีมแชท
            </button>
            <button 
              onClick={() => setActiveTab('avatars')}
              className={`px-2.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 border ${
                activeTab === 'avatars' 
                  ? 'bg-pink-950/45 text-pink-400 border-pink-800/30' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#111117] border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> อวตารแชท
            </button>
            <button 
              onClick={() => setActiveTab('audio')}
              className={`px-2.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 border ${
                activeTab === 'audio' 
                  ? 'bg-amber-950/45 text-amber-400 border-amber-800/30' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#111117] border-transparent'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" /> ปรับเสียง
            </button>
            <button 
              onClick={() => setActiveTab('filter')}
              className={`px-2.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 border ${
                activeTab === 'filter' 
                  ? 'bg-rose-950/45 text-rose-400 border-rose-800/30' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#111117] border-transparent'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> ตัวกรอง
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            {/* WIDGETS MANAGER INSTRUCTIONS TAB */}
            {activeTab === 'widgets' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-800/25 p-4 rounded-xl space-y-1.5 shadow-lg">
                  <h3 className="text-xs font-black uppercase text-cyan-400 font-mono tracking-wider flex items-center gap-1.5">
                    <Laptop className="w-4 h-4" /> แนะนำการติดตั้งใน OBS / Streamlabs
                  </h3>
                  <p className="text-[11.5px] text-zinc-300 leading-relaxed font-sans">
                    คุณสามารถเพลิดเพลินกับสารพัดวิดเจ็ตเพื่อสื่อสารโต้ตอบกับผู้ชมบนช่องสตรีมได้เต็มที่ ทำตามขั้นตอนดังนี้:
                  </p>
                </div>
                
                <div className="space-y-3.5 font-sans text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-cyan-400 w-5 h-5 flex-shrink-0 flex items-center justify-center font-bold rounded-full">1</div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5">
                      เลือกตัววิดเจ็ตที่คุณสนใจจากคลังทางขวา เพื่อดูตัวอย่าง พรีวิว และคอยปรับสตรีมจำลอง
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-cyan-400 w-5 h-5 flex-shrink-0 flex items-center justify-center font-bold rounded-full">2</div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5">
                      กดปุ่ม <strong className="text-white">"คัดลอกลิงก์ OBS"</strong> ใต้การ์ดวิดเจ็ตนั้นไปใช้งาน
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-cyan-400 w-5 h-5 flex-shrink-0 flex items-center justify-center font-bold rounded-full">3</div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5">
                      ใน OBS ของคุณ คลิกเพิ่ม <strong className="text-zinc-100 font-mono font-bold">(+) Sources</strong> เลือก <strong className="text-[#00F0FF] font-black">"Browser"</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-cyan-400 w-5 h-5 flex-shrink-0 flex items-center justify-center font-bold rounded-full">4</div>
                    <p className="text-zinc-300 leading-relaxed pt-0.5">
                      วาง URL ที่ได้ และกำหนดขนาดสัดส่วนจอเป็น <strong className="text-cyan-400 font-black font-mono">1920 x 1080</strong> (เพื่อให้แสดงสีกราฟิกคมชัดสวยงาม)
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-5 space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">🚀 ตั้งค่าด่วนสำหรับคลังวิดเจ็ตสตรีม:</h4>
                  <div className="bg-zinc-950/80 border border-zinc-900 p-4 space-y-4 rounded-xl shadow-inner">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">ขนาดความใหญ่ฟอนต์วิดเจ็ต</span>
                        <span className="font-mono text-cyan-400 font-black">{settings.fontSize}px</span>
                      </div>
                      <input 
                        type="range"
                        min="12"
                        max="48"
                        value={settings.fontSize}
                        onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-zinc-850 rounded appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-xs text-zinc-400">เลือกฟอนต์หลักตัวหนังสือ (Thai Google Font)</span>
                      <select
                        value={settings.fontFamily || 'Prompt'}
                        onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                        className="w-full bg-zinc-900 text-xs border border-zinc-800 rounded px-2.5 py-2 text-white font-sans focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Prompt">Prompt (โมเดิร์นยอดฮิต)</option>
                        <option value="Sarabun">Sarabun (ทางการเรียบร้อย)</option>
                        <option value="Chakra Petch">Chakra Petch (เกมมิ่งไซไฟ)</option>
                        <option value="Mitr">Mitr (กลมมนน่ารัก)</option>
                        <option value="JetBrains Mono">JetBrains Mono (คอมพิวเตอร์เท่ห์)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GENERAL LAYOUT TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* WebSocket Destination */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center justify-between">
                    <span>ลิงก์ฟีดข้อมูล IndoFinity WebSocket</span>
                    <span className="text-[10px] text-zinc-500 font-mono normal-case">ปลายทางพร็อกซีการสตรีม</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={settings.wsUrl}
                      onChange={e => setSettings(prev => ({ ...prev, wsUrl: e.target.value }))}
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded px-3.5 py-2.5 font-mono text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    ค่าเริ่มต้น: <code className="text-zinc-300 font-mono bg-zinc-900 px-1 py-0.5 border border-zinc-800 rounded-none">ws://localhost:62024</code> สำหรับบริการสตรีมมิ่งภายในของ IndoFinity
                  </p>
                </div>

                {/* Font Size controls */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    <span>ขนาดตัวอักษรเริ่มต้น</span>
                    <span className="font-mono text-indigo-400">{settings.fontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="12" 
                    max="28" 
                    value={settings.fontSize}
                    onChange={e => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    className="w-full accent-indigo-500 h-1 bg-zinc-800 appearance-none cursor-pointer rounded-none"
                  />
                </div>

                {/* Max Comments display */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    <span>จำนวนข้อความสูงสุดในคิว</span>
                    <span className="font-mono text-indigo-400">{settings.maxMessages} รายการ</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="25" 
                    value={settings.maxMessages}
                    onChange={e => setSettings(prev => ({ ...prev, maxMessages: Number(e.target.value) }))}
                    className="w-full accent-indigo-500 h-1 bg-zinc-800 appearance-none cursor-pointer rounded-none"
                  />
                  <p className="text-[11px] text-zinc-500">ซ่อนความคิดเห็นเก่าเพื่อจัดระเบียบหน้าสตรีมเกมของคุณให้ไม่เกะกะสายตา</p>
                </div>

                {/* Lifetime settings */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    <span>เวลาแสดงผลก่อนจางหาย</span>
                    <span className="font-mono text-indigo-400">
                      {settings.messageLifetime === 0 ? 'ตลอดไป (ไม่มีการซ่อนอัตโนมัติ)' : `${settings.messageLifetime} วินาที`}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="120" 
                    step="5"
                    value={settings.messageLifetime}
                    onChange={e => setSettings(prev => ({ ...prev, messageLifetime: Number(e.target.value) }))}
                    className="w-full accent-indigo-500 h-1 bg-zinc-800 appearance-none cursor-pointer rounded-none"
                  />
                  <p className="text-[11px] text-zinc-500">ซ่อนกล่องแชทหลังจากครบกำหนดเวลาเพื่อไม่ให้อิโมจิหรือข้อความบังจอเมื่อไม่มีการเคลื่อนไหว</p>
                </div>

                {/* Switch Controls */}
                <div className="space-y-3.5 pt-4.5 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold tracking-wide text-zinc-200">แสดงรูปโปรไฟล์ของผู้ใช้</h4>
                      <p className="text-[11px] text-zinc-500">แสดงรูปโปรไฟล์ต้นฉบับของผู้ใช้ตามแพลตฟอร์ม</p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, showAvatars: !prev.showAvatars }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        settings.showAvatars ? 'bg-indigo-600 justify-end' : 'bg-zinc-850 justify-start'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold tracking-wide text-zinc-200">แสดงป้ายสถานะสตรีมเมอร์</h4>
                      <p className="text-[11px] text-zinc-500">แสดงสัญลักษณ์ ผู้ควบคุมแชท (MOD), ผู้ติดตาม (SUB) และ VIP</p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, showBadges: !prev.showBadges }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        settings.showBadges ? 'bg-indigo-600 justify-end' : 'bg-zinc-850 justify-start'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-900 pt-3.5">
                    <div>
                      <h4 className="text-xs font-mono font-bold tracking-wide text-zinc-200 flex items-center gap-1">
                        <Image className="w-3.5 h-3.5 text-pink-400" /> แยกแจ้งเตือนผู้ชมส่งรูปภาพ
                      </h4>
                      <p className="text-[11px] text-zinc-500">แสดงรูปภาพอ้างอิงแยกออกจากกล่องแชทหลักเพื่อป้องกันความวุ่นวาย</p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, showImageAlerts: !prev.showImageAlerts }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        (settings.showImageAlerts !== false) ? 'bg-indigo-600 justify-end' : 'bg-zinc-850 justify-start'
                      }`}
                      id="toggle-image-alerts-btn"
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>
                </div>

                {/* ⏱️ COUNTDOWN STREAM TIMER PANEL (NEW 🔥) */}
                <div className="p-4 bg-zinc-900/60 border border-indigo-900/30 rounded-lg space-y-4 pt-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase flex items-center gap-1.5">
                        ⏱️ ตัวจับเวลาถอยหลังสตรีม (Stream Countdown Timer)
                      </h4>
                      <p className="text-[11px] text-zinc-550 mt-0.5">
                        เปิด/ปิด และแก้ไขนับเวลาถอยหลังแบบเรียลไทม์ ซิงค์ทันทีกับจอ OBS
                      </p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, showTimer: !prev.showTimer }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        settings.showTimer ? 'bg-indigo-600 justify-end' : 'bg-zinc-850 justify-start'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>

                  {settings.showTimer && (
                    <div className="space-y-3.5 border-t border-zinc-800/60 pt-3">
                      {/* Timer State Readout and Control Buttons */}
                      <div className="flex items-center justify-between bg-zinc-950 p-3 border border-zinc-850">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-550 font-mono tracking-widest block font-bold">เวลาที่เหลืออยู่</span>
                          <span className="text-2xl font-black text-cyan-400 font-mono tracking-wider leading-none">
                            {(() => {
                              const totalSecs = Math.max(0, Math.ceil(dbTimerLeft));
                              const hh = Math.floor(totalSecs / 3600);
                              const mm = Math.floor((totalSecs % 3600) / 60);
                              const ss = totalSecs % 60;
                              const pad = (num: number) => String(num).padStart(2, '0');
                              return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {dbTimerActive ? (
                            <button
                              onClick={() => sendTimerAction('pause')}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 font-mono font-bold text-[11px] text-white flex items-center gap-1 cursor-pointer"
                              title="หยุดชั่วคราว"
                            >
                              ⏸️ หยุดชั่วคราว
                            </button>
                          ) : (
                            <button
                              onClick={() => sendTimerAction('start')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 font-mono font-bold text-[11px] text-white flex items-center gap-1 cursor-pointer"
                              title="เริ่มนับถอยหลัง"
                            >
                              ▶️ เริ่มจับเวลา
                            </button>
                          )}
                          <button
                            onClick={() => sendTimerAction('reset')}
                            className="px-2.5 py-1.5 bg-zinc-810 hover:bg-zinc-700 font-mono font-bold text-[11px] text-zinc-300 cursor-pointer"
                            title="รีเซ็ตเวลาใหม่"
                          >
                            🔄 รีเซ็ต (5 นาที)
                          </button>
                        </div>
                      </div>

                      {/* Add & Subtract Time Grid */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-zinc-400 font-bold block">บวกเวลา (+) หรือ ลบเวลา (-) ชั่วคราว:</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            onClick={() => sendTimerAction('add', 60)}
                            className="py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-emerald-400 border border-zinc-700/60 cursor-pointer"
                          >
                            +1 นาที
                          </button>
                          <button
                            onClick={() => sendTimerAction('add', 300)}
                            className="py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-emerald-400 border border-zinc-700/60 cursor-pointer"
                          >
                            +5 นาที
                          </button>
                          <button
                            onClick={() => sendTimerAction('subtract', 60)}
                            className="py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-rose-400 border border-zinc-700/60 cursor-pointer"
                          >
                            -1 นาที
                          </button>
                          <button
                            onClick={() => sendTimerAction('subtract', 300)}
                            className="py-1 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-rose-400 border border-zinc-700/60 cursor-pointer"
                          >
                            -5 นาที
                          </button>
                        </div>
                      </div>

                      {/* Custom Time Input & Position Selector */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-zinc-400 font-bold block">กำหนดเวลาใหม่ (นาที):</span>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              placeholder="5"
                              id="custom-timer-minutes-input"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 font-mono text-xs text-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = Number((e.currentTarget as HTMLInputElement).value);
                                  if (val > 0) {
                                    sendTimerAction('reset', val * 60);
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                const el = document.getElementById('custom-timer-minutes-input') as HTMLInputElement;
                                if (el) {
                                  const val = Number(el.value);
                                  if (val > 0) {
                                    sendTimerAction('reset', val * 60);
                                  }
                                }
                              }}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-505 text-xs text-white font-mono font-bold cursor-pointer"
                            >
                              ตั้งค่า
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[11px] text-zinc-400 font-bold block">ตำแหน่งแสดงบนสตรีม:</span>
                          <select
                            value={settings.timerPosition}
                            onChange={(e) => setSettings(prev => ({ ...prev, timerPosition: e.target.value as any }))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="top-left">↖️ ซ้ายบน (Top-Left)</option>
                            <option value="top-right">↗️ ขวาบน (Top-Right)</option>
                            <option value="bottom-left">↙️ ซ้ายล่าง (Bottom-Left)</option>
                            <option value="bottom-right">↘️ ขวาล่าง (Bottom-Right)</option>
                            <option value="top-center">⬆️ กึ่งกลางบน (Top-Center)</option>
                          </select>
                        </div>
                      </div>

                      {/* 🌌 TRANSPARENT / BORDERLESS TIMER SETTINGS & STYLES (NEW 🔥) */}
                      <div className="border-t border-zinc-800/60 pt-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-zinc-350 block">✨ พื้นหลังโปร่งใสไม่มีกรอบ (Transparent & Borderless)</span>
                            <span className="text-[10px] text-zinc-550 block">แสดงเฉพาะตัวเลขนาฬิกาเปล่าๆ เหมาะสำหรับเอาไปซ้อนบนหน้าจอ OBS โดยไม่มีกรอบด่างสีดำ</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, timerOnlyNumbers: !prev.timerOnlyNumbers }))}
                            className={`w-9 h-5 rounded-none flex items-center p-0.5 cursor-pointer transition-colors ${
                              settings.timerOnlyNumbers ? 'bg-cyan-500 justify-end' : 'bg-zinc-800 justify-start'
                            }`}
                          >
                            <span className="w-4 h-4 bg-white" />
                          </button>
                        </div>

                        {settings.timerOnlyNumbers && (
                          <div className="space-y-3 bg-zinc-950/60 p-3 border border-zinc-850 rounded">
                            {/* Color Glow Selector Grid */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] text-zinc-400 font-bold block">🎨 สไตล์สีเรืองแสงและมิติแสงเงา 3D (Text Glow Style):</span>
                              <div className="grid grid-cols-2 gap-1.5">
                                {[
                                  { id: 'cyan', label: '🩵 ฟ้าไซเบอร์เรืองแสง (Cyber Glow)' },
                                  { id: 'pink', label: '🩷 ชมพูนีออนส้ม (Hot Neon Glow)' },
                                  { id: 'orange-gold', label: '💛 ทองส้มลุกโชน (Flame Gold)' },
                                  { id: 'white-3d', label: '🤍 ขาว 3D ขอบดำหนา (Classic 3D Projection)' },
                                  { id: 'green-matrix', label: '💚 เขียวแมทริกซ์คอม (Retro Terminal)' },
                                  { id: 'neon-purple', label: '💜 ม่วงหรูหรานีออน (Neon Purple)' }
                                ].map((col) => (
                                  <button
                                    key={col.id}
                                    type="button"
                                    onClick={() => setSettings(prev => ({ ...prev, timerGlowColor: col.id as any }))}
                                    className={`p-2 text-left text-[11px] font-bold border transition-all cursor-pointer ${
                                      settings.timerGlowColor === col.id 
                                        ? 'border-cyan-500 bg-cyan-950/20 text-white' 
                                        : 'border-zinc-850 hover:border-zinc-800 bg-zinc-900/40 text-zinc-400'
                                    }`}
                                  >
                                    {col.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Font Size Selector Slider */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] text-zinc-400 font-bold block">🔎 ขนาดตัวเลขนาฬิกา (Font Size on Stream):</span>
                                <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950 px-1.5 py-0.5">{settings.timerFontSize || 48}px</span>
                              </div>
                              <input
                                type="range"
                                min="24"
                                max="150"
                                value={settings.timerFontSize || 48}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setSettings(prev => ({ ...prev, timerFontSize: val }));
                                }}
                                className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DESIGN THEMES TAB */}
            {activeTab === 'design' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">เลือกรูปแบบธีมแสดงข้อความบนหน้าจอ (Overlay)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'cosmic-nebula', label: '🌠 กาแล็กซีเวกัส 3D (Nebula)', desc: 'แผงไล่เฉดโฮโลสเปซโทนม่วง-ชมพู มีชั้นมิติลึกล้ำพร้อมขอบเรืองแสงออร่าพิเศษ' },
                      { id: 'luxury-obsidian', label: '💎 ออบซิเดียนกรอบทองมีมิติ (3D Obsidian)', desc: 'บล็อกหินออนิกซ์ดำเงาตัดขอบกรอบทองคำ มีขอบนูน Bevel และเงาทอดลึกสะดุดตาเป็นประกาย' },
                      { id: 'futuristic-holo', label: '🦾 โฮโลแกรมโต้ตอบ 3D (Hologram)', desc: 'กรอบอินเตอร์เฟซมุมเฉียงเอียงมีเหลี่ยมสีฟ้าคอนทราสต์ไฮเทค สะท้อนแสงเงาดิจิตอล' },
                      { id: 'vintage-journal', label: '📜 บันทึกสเก็ตช์ 3D (Stacked Paper)', desc: 'สัมผัสกระดาษหนาสไตล์หนังสือโบราณ วางเอียงซ้อนกันเล็กน้อยให้เห็นชั้นเงาธรรมชาติสุดนุ่มนวล' },
                      { id: 'geometric', label: 'สมมาตรทรงเรขาคณิต', desc: 'ดีไซน์แผงมุมเหลี่ยมขอบเฉี่ยว, พัฒนาแนวยานยนต์ไฮเทค' },
                      { id: 'cyberpunk', label: 'นีออนไซเบอร์พังก์', desc: 'โทนสีชมพูนีออนสลับคู่ขอบสว่างสดใสเด่นชัด' },
                      { id: 'glassmorphism', label: 'กระจกฝ้าหรูหรา', desc: 'หน้าต่างกล่องแชทโปร่งใสมีเอฟเฟกต์เบลอหลัง' },
                      { id: 'bubblechat', label: 'กล่องแชทแบบโค้งมน', desc: 'รูปแบบการสนทนาขอบมนกลมแบบดั้งเดิมลื่นไหล' },
                      { id: 'neon-glow', label: 'นีออนเรืองแสง Synthwave', desc: 'โทนสีม่วง-ชมพูเรืองแสงพร้อมเงาสะท้อนสไตล์ย้อนยุคสุดล้ำ' },
                      { id: 'kawaii', label: 'คาวาอี้พาสเทลน่ารัก', desc: 'กล่องแชทสีชมพูหวานแหววขอบกลมมนสไตล์เมฆน่ารัก' },
                      { id: 'gaming-red', label: 'เกมมิ่งเอสปอร์ตแดงสุดเท่', desc: 'ดีไซน์สปอร์ตมุมเอียงโฉบเฉี่ยว สีดำ-แดงเข้มดุดันสะใจ' },
                      { id: 'royal-gold', label: 'ราชวงศ์ทองคำหรูหรา (Royal)', desc: 'ดีไซน์ดำเงาตัดทองสว่างเด่น ไฮคลาสสำหรับ VIP ของคุณ' },
                      { id: 'twitch', label: 'ทวิชคลีนบาร์', desc: 'บล็อกทึบดำสไตล์ทวิชเด่นชัดแยกสีสันตามชื่อผู้แชท' },
                      { id: 'retro', label: 'ย้อนยุคพิกเซล 8-Bit', desc: 'รูปแบบแผงควบคุมจอเทอร์มินัลไฟพิกเซลย้อนยุคกลิ่นอายคลาสสิก' },
                      { id: 'minimal', label: 'มินิมอลโปร่งแสง', desc: 'เน้นความสะอาดสบายตา ไร้กรอบและขอบรบกวน' }
                    ].map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setSettings(prev => ({ ...prev, theme: t.id as any }))}
                        className={`p-3 border text-left flex flex-col justify-between transition-all rounded-none cursor-pointer ${
                          settings.theme === t.id 
                            ? 'border-indigo-500 bg-indigo-950/25' 
                            : 'border-zinc-850 hover:border-zinc-800 bg-zinc-900/30'
                        }`}
                        id={`theme-btn-${t.id}`}
                      >
                        <div>
                          <h4 className="text-xs font-mono font-bold text-zinc-150">{t.label}</h4>
                          <p className="text-[10px] text-zinc-550 font-sans mt-0.5 leading-normal">{t.desc}</p>
                        </div>
                        <div className="mt-2.5 flex justify-end">
                          <span className={`w-2 h-2 rounded-full ${settings.theme === t.id ? 'bg-indigo-400 animate-pulse' : 'bg-transparent'}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* GLASS TYPE SELECTOR SECTION (NEW 🔥) */}
                <div className="space-y-2.5 pt-5 border-t border-zinc-900">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> เลือกประเภทของภาชนะแก้ว / ขวดโหลเก็บสะสมแต้มหัวใจ (Glass Type)
                  </label>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    ปรับประเภทของแก้วเครื่องเล่นพิเศษใน OBS ลิงก์ที่ 6 หัวใจที่กดจะหล่นลงไปกองสะสมและเด้งตอบสนองแบบ 3D Physics!
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'beer', label: '🍺 เหยือกเบียร์', color: 'text-amber-500' },
                      { id: 'wine', label: '🍷 แก้วไวน์', color: 'text-rose-500' },
                      { id: 'cocktail', label: '🍸 แก้วค็อกเทล', color: 'text-pink-500' },
                      { id: 'beaker', label: '🧪 บีกเกอร์', color: 'text-cyan-500' },
                      { id: 'wish-jar', label: '🏺 ขวดโหลโชคดี', color: 'text-violet-500' }
                    ].map(g => (
                      <button 
                        key={g.id}
                        onClick={() => {
                          setSettings(prev => ({ ...prev, glassType: g.id as any }));
                        }}
                        className={`p-2 border text-center flex flex-col items-center justify-center transition-all rounded-none cursor-pointer ${
                          (settings.glassType || 'beer') === g.id 
                            ? 'border-rose-500 bg-rose-950/20' 
                            : 'border-zinc-850 hover:border-zinc-800 bg-zinc-900/30'
                        }`}
                        id={`glass-btn-${g.id}`}
                      >
                        <span className={`text-[11px] font-mono font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full ${g.color}`}>{g.label}</span>
                        <span className={`w-1.5 h-1.5 mt-2.5 rounded-full ${(settings.glassType || 'beer') === g.id ? 'bg-rose-500 animate-pulse' : 'bg-transparent'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🌟 CUSTOM FONT SELECTOR SECTOR (NEW 🔥) */}
                <div className="space-y-3 pt-5 border-t border-zinc-900">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                    ✨ เลือกแบบฟอนต์ภาษาไทย & อังกฤษสวยๆ สำหรับข้อความเวทีและเวลา (Custom Fonts)
                  </label>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    เปลี่ยนสไตล์ตัวอักษรของชื่อผู้พิมพ์ ข้อความแชท และตัวจับเวลาบน OBS Overlay ได้ทันทีด้วย Google Fonts ยอดนิยมที่มีสไตล์โดดเด่นหลากหลายสายสตรีม
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'Prompt', label: 'Prompt (โมเดิร์นคลีน)', style: "font-family: 'Prompt'" },
                      { id: 'Kanit', label: 'Kanit (สปอร์ตโฉบเฉี่ยว)', style: "font-family: 'Kanit'" },
                      { id: 'Itim', label: 'Itim (ลายมือน่ารักตัวกลม)', style: "font-family: 'Itim'" },
                      { id: 'Chakra Petch', label: 'Chakra Petch (ไซเบอร์ไฮเทค)', style: "font-family: 'Chakra Petch'" },
                      { id: 'Mitr', label: 'Mitr (กลมมนเป็นมิตร)', style: "font-family: 'Mitr'" },
                      { id: 'Mali', label: 'Mali (น่ารักสไตล์คุ้กกี้)', style: "font-family: 'Mali'" }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, fontFamily: f.id }))}
                        className={`p-3 border text-left flex flex-col justify-between transition-all rounded-none cursor-pointer ${
                          settings.fontFamily === f.id 
                            ? 'border-indigo-500 bg-indigo-950/25 ring-1 ring-indigo-500/20' 
                            : 'border-zinc-850 hover:border-zinc-800 bg-zinc-900/30'
                        }`}
                        id={`font-family-btn-${f.id.replace(/\s+/g, '-')}`}
                      >
                        <span className="text-xs font-bold text-zinc-200" style={{ fontFamily: f.id }}>{f.id} Theme</span>
                        <span className="text-[10px] text-zinc-500 mt-1" style={{ fontFamily: f.id }}>
                          สวัสดีแชททีวี ยินดีต้อนรับ!
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-xs text-zinc-400 font-mono font-bold whitespace-nowrap">ระบุชื่อ Google Font อื่นๆ ได้ด้วยตนเอง:</span>
                    <input 
                      type="text" 
                      value={settings.fontFamily || ''}
                      onChange={e => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                      placeholder="เช่น Sarabun, Charm, Sriracha, Mitr"
                      className="flex-1 bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STREAM AVATARS SETTINGS TAB */}
            {activeTab === 'avatars' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-indigo-400 font-mono flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-500" /> ตั้งค่าเบราว์เซอร์ซอร์สระบบอวตาร (Stream Avatars)
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    เพิ่มความน่ารักให้หน้าจอไลฟ์สตรีมของคุณ! ตัวละครจะเดินไปมารอบๆ ฝั่งล่างของจอ และเมื่อมีคนพิมพ์แชทเข้ามาในไลฟ์ จะมีฟองคำพูดแชทลอยอยู่บนหัวตัวละครอวตารผู้พิมพ์นั้นทันที!
                  </p>
                </div>

                {/* Master Switcher for Stream Avatars */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 space-y-4 rounded-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-pink-400" />
                      <div>
                        <h4 className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wide">
                          เปิด/ปิดใช้งานระบบแสดงตลับละครอวตารเดิน (Enable Stream Avatars Stage)
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-snug">
                          เปิดใช้งานเพื่อแสดงตัวละครอวตารเดินสัญจรไปมา หากปิดระบบนี้ ตัวละครอวตารทั้งหมดจะไม่ปรากฏขึ้นเลยบนหน้าจอหลัก ไม่ว่าในสถานการณ์ใดๆ
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, showWalkingAvatars: prev.showWalkingAvatars === false ? true : false }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors shrink-0 ${
                        (settings.showWalkingAvatars !== false) ? 'bg-pink-500 justify-end' : 'bg-zinc-800 justify-start'
                      }`}
                      id="toggle-master-walking-avatars-btn"
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>
                </div>

                {/* Vector Avatar Movement Speed Settings Option */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 space-y-4 rounded-none">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                    <h4 className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wide">
                      ตั้งค่าความเร็วของแบบเวกเตอร์ขยับได้ (Vector Avatar Speed Controls)
                    </h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span className="text-zinc-400 uppercase text-[10px]">ปรับแต่งความเร็วเดิน/วิ่งสัญจร</span>
                      <span className="text-pink-400 font-extrabold text-[12px] bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                        x{(settings.vectorAvatarSpeed ?? 1.0).toFixed(1)} 
                        {settings.vectorAvatarSpeed === 1.0 && " (ปกติ)"}
                        {(settings.vectorAvatarSpeed ?? 1.0) < 0.6 && " (เดินน่ารักเรียบร้อย/ช้าลง)"}
                        {(settings.vectorAvatarSpeed ?? 1.0) > 1.8 && " (วิ่งรวดเร็วกระฉับกระเฉง)"}
                      </span>
                    </div>
                    
                    <input 
                      type="range"
                      min="0.1" 
                      max="2.5" 
                      step="0.1"
                      value={settings.vectorAvatarSpeed ?? 1.0}
                      onChange={e => setSettings(prev => ({ ...prev, vectorAvatarSpeed: parseFloat(e.target.value) }))}
                      className="w-full accent-pink-500 h-1.5 bg-zinc-850 appearance-none cursor-pointer rounded-none"
                    />
                    
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>🚶‍♂️ ช้าลงมาก (0.1x)</span>
                      <span>🏃‍♂️ ความเร็วปกติ (1.0x)</span>
                      <span>🚀 ซิ่งไวสะท้านสตรีม (2.5x)</span>
                    </div>
                  </div>
                </div>

                {/* Auto-Hide when idle settings option */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 space-y-4 rounded-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-pink-400" />
                      <div>
                        <h4 className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wide">
                          ระบบซ่อนตัวอวตารเมื่อไม่มีคนแชท/ใช้งาน (Auto-Hide on Idle)
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-snug">
                          ซ่อนอวตารอย่างนุ่มนวลอัตโนมัติหากไม่มีการพิมพ์แชทหรือเว้นระยะแชทนานเกินเวลาที่กำหนด (จะปรากฏตัวอีกครั้งทันทีเมื่อมีผู้แชทใหม่หรือกดจำลองการทำงาน)
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, hideWhenIdle: !prev.hideWhenIdle }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        settings.hideWhenIdle ? 'bg-pink-500 justify-end' : 'bg-zinc-800 justify-start'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>

                  {settings.hideWhenIdle && (
                    <div className="border-t border-zinc-850 pt-3 space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono font-bold">
                        <span className="text-zinc-400 uppercase text-[10px] flex items-center gap-1.5">
                          ตั้งเวลาซ่อนเมื่อไม่มีการใช้งาน (Idle Timeout)
                        </span>
                        <span className="text-pink-400 font-extrabold text-[12px] bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                          {settings.idleTimeout ?? 60} วินาที ({( ((settings.idleTimeout ?? 60) / 60).toFixed(1) )} นาที)
                        </span>
                      </div>

                      <input 
                        type="range"
                        min="10" 
                        max="300" 
                        step="10"
                        value={settings.idleTimeout ?? 60}
                        onChange={e => setSettings(prev => ({ ...prev, idleTimeout: parseInt(e.target.value) }))}
                        className="w-full accent-pink-500 h-1.5 bg-zinc-850 appearance-none cursor-pointer rounded-none"
                      />

                      <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                        <span>⏱️ ทดสอบไว (10 วิ)</span>
                        <span>⏱️ พักผ่อนสายกลาง (1 นาที)</span>
                        <span>⏱️ ยืนคุยยาวนาน (5 นาที)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Spawn only on activity settings option */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 space-y-4 rounded-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <div>
                        <h4 className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wide">
                          ระบบอวตารปรากฏตัวเมื่อพิมพ์แชทเท่านั้น (Spawn On-Demand Overlay)
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-snug">
                          เมื่อเปิดใช้งาน ตัวละครอวตารจะไม่เดินอยู่ตลอดเวลาตั้งแต่เริ่มแรก แต่จะสลับมาปรากฏตัวเพิ่มขึ้นทีละตัวเมื่อเจ้าตัวพิมพ์ข้อความจำลองหรือใช้งานจริงเท่านั้น ส่วนถ้าปิดระบบนี้ ตัวละครหลักทั้งหมดจะออกมาเดินเล่นตั้งแต่เริ่มแรกเลย
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, spawnOnlyOnActivity: !prev.spawnOnlyOnActivity }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        (settings.spawnOnlyOnActivity ?? true) ? 'bg-pink-500 justify-end' : 'bg-zinc-800 justify-start'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>

                  {/* Visitor limits adjustment slider */}
                  <div className="border-t border-zinc-850/60 pt-3.5 space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                      <span className="text-zinc-300">จำนวนตัวละครผู้ชม/จำลองที่แสดงพร้อมกันสูงสุดบนจอ</span>
                      <span className="text-pink-400 font-bold bg-pink-950/40 px-1.5 py-0.5 border border-pink-900/10 text-xs">{settings.maxVisitorAvatars ?? 1} ตัว</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={settings.maxVisitorAvatars ?? 1}
                      onChange={e => setSettings(prev => ({ ...prev, maxVisitorAvatars: Number(e.target.value) }))}
                      className="w-full h-1 accent-pink-500 bg-zinc-850 rounded-none appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                      กรณีที่มีผู้ชมพิมพ์แชทหรือกดส่งหัวใจหลายคนในเวลาไล่เลี่ยกัน ตัวละครผู้ชมเดิมจะเดินออกจากสกรีนและถูกเปลี่ยนเป็นข้อความของตัวละครใหม่ล่าสุดแทน เพื่อไม่ให้สกรีนซ้อนสะสมกันมากเกินไป (แนะนำตั้งไว้ที่ 1 ตัว เพื่อให้วิ่งปรากฏตัวทีละตัวตามตัวอย่าง)
                    </p>
                  </div>
                </div>

                {/* Auto-Hide when no viewers settings option */}
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 space-y-4 rounded-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-pink-400" />
                      <div>
                        <h4 className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wide">
                          ระบบซ่อนตัวอวตารอัจฉริยะเมื่อไม่มีคนดู (Smart Avatar Auto-Hide Controls)
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-snug">
                          เมื่อเปิดใช้งาน ตัวละครอวตารทั้งหมดจะซ่อนตัวอย่างนุ่มนวลเมื่อไม่มีคนดูเพื่อไม่ให้บังส่วนสำคัญของวิดีโอค้างไว้
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, hideAvatarsWhenNoViewers: !prev.hideAvatarsWhenNoViewers }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        settings.hideAvatarsWhenNoViewers ? 'bg-pink-500 justify-end' : 'bg-zinc-800 justify-start'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>

                  {/* Simulated testing slider */}
                  <div className="border-t border-zinc-850 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono font-bold">
                      <span className="text-zinc-400 uppercase text-[10px] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-400" /> จำลองยอดผู้ชมสดบนแดชบอร์ด (Simulate Live Viewers)
                      </span>
                      <span className={`font-extrabold text-[12px] px-2 py-0.5 rounded border ${
                        (settings.testViewerCount ?? 1) === 0 
                          ? 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' 
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}>
                        {(settings.testViewerCount ?? 1)} คน
                        {(settings.testViewerCount ?? 1) === 0 && " (💤 ปล่อยว่าง/ไม่มีผู้ชม)"}
                        {(settings.testViewerCount ?? 1) > 0 && " (🔥 กำลังดูสตรีมสด)"}
                      </span>
                    </div>

                    <input 
                      type="range"
                      min="0" 
                      max="15" 
                      step="1"
                      value={settings.testViewerCount ?? 1}
                      onChange={e => setSettings(prev => ({ ...prev, testViewerCount: parseInt(e.target.value) }))}
                      className="w-full accent-pink-500 h-1.5 bg-zinc-850 appearance-none cursor-pointer rounded-none"
                    />

                    <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                      <span>💤 ไม่มีคนดู (0 คน)</span>
                      <span>👥 สตรีมสบายๆ (5-10 คน)</span>
                      <span>🎉 ไลฟ์ระเบิดความมันส์ (15 คน)</span>
                    </div>

                    {settings.hideAvatarsWhenNoViewers && (settings.testViewerCount ?? 1) === 0 && (
                      <div className="mt-2 text-[10px] text-pink-400 font-mono flex items-center gap-1.5 bg-pink-500/5 border border-pink-500/10 p-2">
                        <span className="inline-block w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                        สถานะตอนนี้: ตัวละครอวตารสไลด์ลงและหายไปจากจอสตรีมเรียบร้อย! (เลื่อนแถบเพื่อเรียกผู้ชมขึ้นมาใหม่)
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick select presets matching Stream Avatars marketplace layout */}
                <div className="p-4 bg-zinc-950/70 border border-zinc-850">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-150 uppercase font-mono flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-500 animate-pulse" /> ตลาดอวตารนักสัญจร (STREAM AVATARS MARKETPLACE)
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                        เลือกอวตารนำเข้าจอไลฟ์สตรีมของคุณ ตกแต่งให้น่ารักสะดุดตา (กด <span className="text-pink-400 font-mono font-bold">+ Add</span> เพื่อเพิ่มเข้าสตรีมคุณ!)
                      </p>
                    </div>
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 uppercase font-mono shrink-0 rounded">
                      ✨ PREMIUM UNLOCKED
                    </span>
                  </div>

                  {/* Switcher tabs for marketplace types */}
                  <div className="flex border-b border-zinc-850 gap-1.5 mb-4 mt-1">
                    <button
                      onClick={() => setMarketplaceTab('vector')}
                      className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                        marketplaceTab === 'vector'
                          ? 'border-b-pink-500 text-pink-400 bg-zinc-900/40 font-extrabold'
                          : 'border-b-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" /> 👾 แบบเวกเตอร์ขยับได้ (ไม่ต้องใช้รูปภาพ - คมชัดมาก)
                    </button>
                    <button
                      onClick={() => setMarketplaceTab('classic')}
                      className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                        marketplaceTab === 'classic'
                          ? 'border-b-pink-500 text-pink-400 bg-zinc-900/40 font-extrabold'
                          : 'border-b-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-500" /> 🖼️ แบบมีรูปภาพดั้งเดิม (รูปภาพอนิเมชัน GIF)
                    </button>
                  </div>

                  {/* Marketplace Grid mirroring the user's attachment exactly */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 font-sans max-h-[480px] overflow-y-auto pr-1">
                    {(marketplaceTab === 'vector' ? VECTOR_PRESET_AVATARS : PRESET_AVATARS).map(preset => (
                      <div
                        key={preset.id}
                        className="relative bg-zinc-900/60 border border-zinc-850 hover:border-pink-500/60 hover:bg-zinc-900 transition-all flex flex-col justify-between overflow-hidden shadow-lg p-3 group"
                      >
                        {/* Crown icon on superior upper corner matching screen capture */}
                        <div className="absolute top-2 right-2 z-10">
                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        </div>

                        {/* Interactive Centered character with premium walk/bounce style */}
                        <div className="h-28 flex items-center justify-center p-2 select-none relative overflow-visible">
                          {/* Pulsing glow ring inside */}
                          <div className="absolute inset-0 m-auto w-14 h-14 bg-pink-500/5 rounded-full filter blur-xl group-hover:bg-pink-500/10 transition-colors" />
                          
                          {preset.spriteUrl.startsWith('vector:') ? (
                            <div className="transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                              <VectorAvatar 
                                type={preset.spriteUrl.replace('vector:', '')} 
                                facing="right" 
                                isJumping={false} 
                                isSpeaking={true} 
                                scale={preset.scale || 1.15}
                              />
                            </div>
                          ) : (
                            <img 
                              src={preset.spriteUrl} 
                              alt={preset.name} 
                              className="w-20 h-20 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)] transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        {/* Text Caption label info */}
                        <div className="text-center mb-2.5 min-w-0">
                          <p className="text-[11.5px] font-bold text-zinc-100 truncate tracking-wide" title={preset.name}>
                            {preset.name.split(' ')[0]} {preset.name.split(' ')[1] || ''}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">
                            {preset.name.includes('(') ? preset.name.substring(preset.name.indexOf('(')) : 'สเกล: x' + preset.scale}
                          </p>
                        </div>

                        {/* + Add action button replicating Stream Avatars software interface */}
                        <button
                          onClick={() => {
                            const newId = Math.random().toString(36).substring(2, 9);
                            setSettings(prev => ({
                              ...prev,
                              customAvatars: [...(prev.customAvatars || []), { ...preset, id: newId }]
                            }));
                          }}
                          className="w-full py-1.5 bg-zinc-950 hover:bg-pink-600 border border-zinc-800 hover:border-pink-500 text-zinc-300 hover:text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm active:translate-y-[1px]"
                        >
                          <Sparkles className="w-3 h-3 text-yellow-400 group-hover:text-white shrink-0" />
                          + Add อวตาร
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add new custom avatar form */}
                <div className="p-4 bg-zinc-900/15 border border-zinc-850 space-y-3 font-sans">
                  <h4 className="text-xs font-mono font-bold text-zinc-150 uppercase flex items-center gap-1.5">➕ เพิ่มหรืออัญเชิญอวตารตัวของคุณเอง</h4>
                  <p className="text-[10.5px] text-zinc-500 leading-normal">
                    ใส่ภาพหรือลิงก์ GIF อนิเมชันตัวโปรดของคุณ เพื่อทำเป็นอวตารเดินสัญจรบนสตรีมของคุณ
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-mono text-zinc-400 font-bold uppercase block">ชื่อตัวละครอวตาร</label>
                      <input 
                        type="text" 
                        placeholder="เช่น น้องแงวสุดซ่า, สไลม์เกรียน"
                        value={newAvatarName}
                        onChange={e => setNewAvatarName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-none px-3 py-1.5 text-xs text-white placeholder-zinc-600 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-mono text-zinc-400 font-bold uppercase block">ลิงก์รูปภาพ / ไฟล์ GIF โปร่งใส (URL)</label>
                      <input 
                        type="text" 
                        placeholder="https://...รูปภาพโปร่งใส.gif"
                        value={newAvatarUrl}
                        onChange={e => setNewAvatarUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-none px-3 py-1.5 text-xs text-white placeholder-zinc-650 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between font-mono text-[10.5px] text-zinc-400">
                        <span className="font-bold uppercase text-[9.5px]">ปรับขนาดตัวละคร (SCALE)</span>
                        <span className="text-pink-400 font-bold font-mono">x{newAvatarScale.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2.5" 
                        step="0.1"
                        value={newAvatarScale}
                        onChange={e => setNewAvatarScale(parseFloat(e.target.value))}
                        className="w-full accent-pink-500 h-1 bg-zinc-800"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newAvatarName.trim() || !newAvatarUrl.trim()) {
                          alert('กรุณากรอกชื่อตัวละครและลิงก์รูปภาพอวตารให้ครบถ้วนก่อนส่ง!');
                          return;
                        }
                        addCustomAvatar(newAvatarName, newAvatarUrl, newAvatarScale);
                        setNewAvatarName('');
                        setNewAvatarUrl('');
                        setNewAvatarScale(1.0);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 font-bold font-mono uppercase px-4 py-2 text-white h-auto rounded-none text-xs self-end shrink-0"
                    >
                      + บันทึกเพิ่มอวตาร
                    </button>
                  </div>
                </div>

                {/* List of active custom avatars */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                      📁 คอนฟิกตัวละครอวตารในระบบสตรีมน่ารัก ({settings.customAvatars?.length || 0})
                    </h4>
                    <button
                      onClick={resetCustomAvatars}
                      className="text-[10px] uppercase font-mono text-zinc-500 hover:text-red-400 flex items-center gap-1 underline transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> คืนค่าเริ่มต้นทั้งหมด
                    </button>
                  </div>
                  
                  <div className="max-h-[220px] overflow-y-auto border border-zinc-900 bg-zinc-950 p-2 space-y-1.5 font-mono">
                    {(!settings.customAvatars || settings.customAvatars.length === 0) ? (
                      <p className="text-[10.5px] text-zinc-650 p-4 text-center">ไม่มีตัวละครอวตารทำงานอยู่ กรุณากดปุ่มเพิ่มหรือดึงตัวตั้งต้นแนะนําด้านบน</p>
                    ) : (
                      settings.customAvatars.map(av => (
                        <div key={av.id} className="flex items-center justify-between bg-zinc-900/30 p-2 border border-zinc-850">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 flex items-center justify-center bg-zinc-950 rounded border border-zinc-800 shrink-0">
                              {av.spriteUrl.startsWith('vector:') ? (
                                <VectorAvatar 
                                  type={av.spriteUrl.replace('vector:', '')} 
                                  facing="right" 
                                  isJumping={false} 
                                  isSpeaking={false} 
                                  scale={0.7}
                                />
                              ) : (
                                <img 
                                  src={av.spriteUrl} 
                                  alt="" 
                                  className="w-8 h-8 object-contain" 
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-zinc-350 font-bold truncate">{av.name}</p>
                              <p className="text-[9px] text-zinc-650 truncate max-w-[180px] md:max-w-[320px]">{av.spriteUrl}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] text-zinc-400 font-bold font-mono">x{av.scale || 1.0}</span>
                            <button
                              onClick={() => deleteCustomAvatar(av.id)}
                              className="p-1 text-zinc-500 hover:text-red-500 transition-colors"
                              title="ลบอวตารตัวนี้"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Copy stream overlay instruction */}
                <div className="p-3.5 bg-indigo-950/10 border border-indigo-900/30 font-mono">
                  <h5 className="text-[11px] font-bold text-indigo-400 uppercase flex items-center gap-1.5 mb-1.5 font-mono">
                    ⚙️ วิธีเปิดใช้งานใน OBS STUDIO
                  </h5>
                  <ul className="list-disc pl-4 text-[11px] text-zinc-400 space-y-1.5 font-sans leading-relaxed">
                    <li>คัดลอกลิงก์ด้านขวาบนหน้า <strong className="text-pink-400">"OBS ลิงก์ที่ 5: แสดงตัวอวตารตกแต่งจอ"</strong></li>
                    <li>ในโปรแกรม OBS, เพิ่มแหล่งข้อมูล <strong>"Browser Source" (เบราว์เซอร์ซอร์ส)</strong></li>
                    <li>วางลิงก์ที่คัดลอกมา และตั้งขนาดหน้าจอให้ใหญ่ตามต้องการ (เช่น <strong>กว้าง 1200 x สูง 500</strong> หรือเต็มจอ 1920x1080)</li>
                    <li>ลากตัวเบราว์เซอร์ซอร์สมาไว้ด้านล่างสุดของช่องไลฟ์สตรีม เพื่อให้อวตารเดินไปเดินมาบนพื้นได้อย่างน่ารัก!</li>
                  </ul>
                </div>
              </div>
            )}

            {/* AUDIO & TEXT_TO_SPEECH SETTINGS TAB */}
            {activeTab === 'audio' && (
              <div className="space-y-5">
                {/* Alert Sounds Master switch */}
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-805 rounded-none flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-zinc-100 uppercase">เปิดใช้งานเสียงแจ้งเตือน (Alert Sounds)</h4>
                    <p className="text-[11px] text-zinc-550 mt-1 leading-normal">
                      เล่นไฟล์เสียงเอฟเฟกต์สั้นๆ เมื่อมีความเห็นส่งของขวัญ กดติดตาม หรืออื่นๆ เกิดขึ้น
                    </p>
                  </div>
                  <button 
                    onClick={() => setSettings(prev => ({ ...prev, alertSounds: !prev.alertSounds }))}
                    className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                      settings.alertSounds ? 'bg-indigo-600 justify-end' : 'bg-zinc-850 justify-start'
                    }`}
                    id="alert-sounds-toggle"
                  >
                    <span className="w-3.5 h-3.5 bg-white" />
                  </button>
                </div>

                {/* Text To Speech toggle */}
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-800 rounded-none space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold text-zinc-100 flex items-center gap-1.5 uppercase transition-colors">
                        ออกเสียงอ่านแชทด้วยระบบเสียงสังเคราะห์ (TTS)
                      </h4>
                      <p className="text-[11px] text-zinc-550 mt-1 leading-normal">
                        เครื่องคอมพิวเตอร์จะแวะอ่านความคิดเห็นสั้นๆ และชื่อผู้ใช้อัตโนมัติเป็นเสียงภาษาไทย
                      </p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, textToSpeech: !prev.textToSpeech }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        settings.textToSpeech ? 'bg-indigo-600 justify-end' : 'bg-zinc-850 justify-start'
                      }`}
                      id="tts-master-toggle"
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>

                  {settings.textToSpeech && (
                    <div className="space-y-3 pt-3 border-t border-zinc-850">
                      {/* TTS rate slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-400 leading-none">
                          <span>อัตราความเร็วในการออกเสียง</span>
                          <span>{settings.ttsVoiceRate || 1.0}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="2.0" 
                          step="0.1"
                          value={settings.ttsVoiceRate || 1.0}
                          onChange={e => setSettings(prev => ({ ...prev, ttsVoiceRate: Number(e.target.value) }))}
                          className="w-full accent-indigo-500 h-1 bg-[#27272a] appearance-none cursor-pointer rounded-none"
                          id="tts-rate-slider"
                        />
                      </div>

                      {/* TTS pitch slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-400 leading-none">
                          <span>ระดับคีย์เสียงสูงต่ำ (Pitch)</span>
                          <span>{settings.ttsVoicePitch || 1.0}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="1.5" 
                          step="0.1"
                          value={settings.ttsVoicePitch || 1.0}
                          onChange={e => setSettings(prev => ({ ...prev, ttsVoicePitch: Number(e.target.value) }))}
                          className="w-full accent-indigo-500 h-1 bg-[#27272a] appearance-none cursor-pointer rounded-none"
                          id="tts-pitch-slider"
                        />
                      </div>

                      {/* Select Speech Engine */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-400 leading-none">
                          <span>ระบุระบบประมวลผลเสียง (Speech Engine / Voice Server)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, ttsEngine: 'google' }))}
                            className={`px-2 py-2.5 text-xs font-mono border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                              settings.ttsEngine === 'google' || !settings.ttsEngine
                                ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                                : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <span className="font-bold flex items-center gap-1 text-[11px]">☁️ Google Free</span>
                            <span className="text-[9px] text-zinc-500 mt-1 leading-tight">เสียงไทยแท้ทั่วไป ไม่ต้องระบุคีย์</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, ttsEngine: 'google_cloud_premium' }))}
                            className={`px-2 py-2.5 text-xs font-mono border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                              settings.ttsEngine === 'google_cloud_premium'
                                ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                                : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <span className="font-bold flex items-center gap-1 text-[11px]">🔥 Cloud Premium</span>
                            <span className="text-[9px] text-zinc-500 mt-1 leading-tight">เสียง Neural2 คมชัดระดับมนุษย์ (มีเสถียรภาพสูงสุด)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, ttsEngine: 'browser' }))}
                            className={`px-2 py-2.5 text-xs font-mono border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                              settings.ttsEngine === 'browser'
                                ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                                : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <span className="font-bold flex items-center gap-1 text-[11px]">🖥️ Browser Synthesizer</span>
                            <span className="text-[9px] text-zinc-500 mt-1 leading-tight">สังเคราะห์ด้วยเสียงที่มีในระบบเบราว์เซอร์คุณ</span>
                          </button>
                        </div>
                      </div>

                      {/* Select Voice selector (only visible/relevant if Web TTS is selected) */}
                      {settings.ttsEngine === 'google_cloud_premium' && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-400 leading-none">
                            <span>Google Cloud API Key (ใช้คีย์สำหรับ TTS เสถียรและชัดขึ้น)</span>
                          </div>
                          <input
                            type="password"
                            placeholder="ป้อน Google Cloud API Key (เช่น AIzaSy...)"
                            value={settings.ttsApiKey || ''}
                            onChange={e => setSettings(prev => ({ ...prev, ttsApiKey: e.target.value }))}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-none px-2 py-1.5 text-xs text-white font-mono leading-tight focus:outline-none focus:border-indigo-500"
                          />
                          <p className="text-[10px] text-zinc-500 leading-normal">
                            * แนะนำ: คีย์ Google Cloud ช่วยตัดปัญหา IP โดนบล็อกได้ 100% และให้เสียงระดับ Neural2 สมจริงสุดๆ (ฟรีโควต้าสังเคราะห์ของ Google ตลอดชื่อบัญชี)
                          </p>
                        </div>
                      )}

                      {/* Select Voice selector (only visible/relevant if Web TTS is selected) */}
                      {settings.ttsEngine === 'browser' ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-400 leading-none">
                            <span>คัดเลือกระบบเสียงสังเคราะห์ (Voice Player)</span>
                            <span className="text-[9px] text-emerald-400 bg-emerald-950/40 px-1 py-0.2 border border-emerald-900/10 uppercase">
                              {voices.filter(v => v.lang.startsWith('th')).length} ค้นพบเสียงไทย
                            </span>
                          </div>
                          <select
                            value={settings.ttsVoiceName || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setSettings(prev => ({ ...prev, ttsVoiceName: val || undefined }));
                            }}
                            className="w-full bg-[#18181b] border border-zinc-800 rounded-none px-2 py-1.5 text-xs text-white font-mono leading-tight focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">[เสียงคัดเลือกภาษาเบราว์เซอร์อัตโนมัติ]</option>
                            {/* Thai voices first */}
                            <optgroup label="เสียงวรรณยุกต์ภาษาไทย (Thai Speech Systems)">
                              {voices.filter(v => v.lang.startsWith('th') || v.lang.includes('th-')).map(v => (
                                <option key={v.name} value={v.name}>
                                  🇹🇭 {v.name} ({v.lang})
                                </option>
                              ))}
                              {voices.filter(v => v.lang.startsWith('th') || v.lang.includes('th-')).length === 0 && (
                                <option disabled className="text-zinc-550 italic">ไม่พบตัวขับขี่เสียงอื่นๆ (ระบุมาตรฐาน th-TH)</option>
                              )}
                            </optgroup>
                            {/* Other languages */}
                            <optgroup label="เสียงระบบในภาษาอื่นๆ (All other system voices)">
                              {voices.filter(v => !v.lang.startsWith('th') && !v.lang.includes('th-')).map(v => (
                                <option key={v.name} value={v.name}>
                                  {v.lang.startsWith('en') ? '🇺🇸' : '🌐'} {v.name} ({v.lang})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          <p className="text-[10px] text-zinc-500 leading-snug">
                            *รองรับเสียงสังเคราะห์ภาษาไทยเต็มรูปแบบผ่าน Chrome, Edge, Safari และ iOS/Android โดยค่าเริ่มต้นของระบบจะใช้โมเดลเสียงที่ดีที่สุดของเบราว์เซอร์คุณโดยตรง
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-indigo-950/10 border border-indigo-900/20 rounded-none text-[10.5px] text-zinc-400 font-mono leading-relaxed space-y-1">
                          <p className="text-indigo-400 font-bold">✨ กำลังใช้: Google Cloud High Quality Web TTS Engine</p>
                          <p>
                            ระบบจะเลือกประมวลผลคำแปลและออกเสียงภาษาไทยที่ถูกต้อง เป็นธรรมชาติ ไหลลื่นที่สุดโดยอัตโนมัติ 
                            แก้ปัญหาสำหรับเครื่องคอมพิวเตอร์ แท็บเล็ต หรือสมาร์ทโฟนที่เบราว์เซอร์ไม่มีโปรแกรมอ่านเสียงภาษาไทยติดตั้งไว้ล่วงหน้า
                          </p>
                        </div>
                      )}

                      {/* Detailed Read/Speak Events Selection */}
                      <div className="space-y-2 pt-3 border-t border-zinc-800/60 mt-2">
                        <div className="text-[10.5px] font-mono text-zinc-400 leading-none">
                          <span>ตั้งค่าการออกเสียงรายกิจกรรม (Speak Event Filtering)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          {/* Speak Chats Toggle */}
                          <label className="flex items-center gap-2 bg-[#18181b]/60 border border-zinc-800/80 px-2 py-1.5 cursor-pointer hover:border-zinc-700/80 transition-colors select-none">
                            <input 
                              type="checkbox"
                              checked={settings.ttsReadChat !== false}
                              onChange={e => setSettings(prev => ({ ...prev, ttsReadChat: e.target.checked }))}
                              className="accent-indigo-500 rounded-none w-3.5 h-3.5"
                            />
                            <span className="text-zinc-300">💬 อ่านข้อความแชท</span>
                          </label>

                          {/* Speak Gifts Toggle */}
                          <label className="flex items-center gap-2 bg-[#18181b]/60 border border-zinc-800/80 px-2 py-1.5 cursor-pointer hover:border-zinc-700/80 transition-colors select-none">
                            <input 
                              type="checkbox"
                              checked={settings.ttsReadGift !== false}
                              onChange={e => setSettings(prev => ({ ...prev, ttsReadGift: e.target.checked }))}
                              className="accent-indigo-500 rounded-none w-3.5 h-3.5"
                            />
                            <span className="text-zinc-300">🎁 อ่านเมื่อส่งของขวัญ</span>
                          </label>

                          {/* Speak Follows Toggle */}
                          <label className="flex items-center gap-2 bg-[#18181b]/60 border border-zinc-800/80 px-2 py-1.5 cursor-pointer hover:border-zinc-700/80 transition-colors select-none">
                            <input 
                              type="checkbox"
                              checked={settings.ttsReadFollow !== false}
                              onChange={e => setSettings(prev => ({ ...prev, ttsReadFollow: e.target.checked }))}
                              className="accent-indigo-500 rounded-none w-3.5 h-3.5"
                            />
                            <span className="text-zinc-300">➕ อ่านเมื่อมีคนติดตาม</span>
                          </label>

                          {/* Speak Images Toggle */}
                          <label className="flex items-center gap-2 bg-[#18181b]/60 border border-zinc-800/80 px-2 py-1.5 cursor-pointer hover:border-zinc-700/80 transition-colors select-none">
                            <input 
                              type="checkbox"
                              checked={settings.ttsReadShareImage !== false}
                              onChange={e => setSettings(prev => ({ ...prev, ttsReadShareImage: e.target.checked }))}
                              className="accent-indigo-500 rounded-none w-3.5 h-3.5"
                            />
                            <span className="text-zinc-300">🖼️ อ่านเมื่อส่งรูปภาพ</span>
                          </label>
                        </div>

                        {/* Skip Nickname Option */}
                        <div className="pt-1.5">
                          <label className="flex items-center justify-between bg-indigo-950/20 border border-indigo-900/30 px-3 py-2 cursor-pointer hover:bg-indigo-950/30 transition-colors select-none">
                            <span className="flex flex-col">
                              <span className="text-xs font-bold text-indigo-300 font-mono">🔇 ข้ามการอ่านชื่อผู้ส่ง</span>
                              <span className="text-[9.5px] text-zinc-500 leading-tight">ข้ามคำนำหน้า "[ชื่อผู้สตรีม] กล่าวว่า" เพื่อความกระชับรวดเร็วในการสตรีม</span>
                            </span>
                            <input 
                              type="checkbox"
                              checked={settings.ttsSkipNickname === true}
                              onChange={e => setSettings(prev => ({ ...prev, ttsSkipNickname: e.target.checked }))}
                              className="accent-indigo-500 rounded-none w-4 h-4 ml-2"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* KEYWORD FILTERS TAB */}
            {activeTab === 'filter' && (
              <div className="space-y-5">
                {/* Highlights word bank */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block font-mono">คีย์เวิร์ดเน้นสีสันตรวจสอบระบบ</label>
                  <p className="text-[11px] text-zinc-500">ความคิดเห็นที่มีคำหรือคำพ้องตรงกับตรงนี้ ตัวบล็อกหรือแชทจะแสดงสว่างเป็นพิเศษเพื่อดึงดูดความสนใจ</p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ระบุคำสำคัญ (เช่น: สวย, แจก, อวด)..."
                      value={keywordInput}
                      onChange={e => setKeywordInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                      className="flex-grow bg-[#18181b] border border-zinc-800 rounded-none px-3 py-1.5 text-xs text-white font-mono"
                    />
                    <button 
                      onClick={handleAddKeyword}
                      className="bg-[#27272a] hover:bg-[#3f3f46] text-white font-mono px-4 rounded-none text-xs"
                    >
                      เพิ่มคำ
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {settings.highlightKeywords.map(kw => (
                      <span 
                        key={kw}
                        className="bg-indigo-950/80 text-indigo-300 px-2.5 py-1 text-xs font-mono font-bold border border-indigo-900/50 flex items-center gap-1.5 rounded-none"
                      >
                        {kw}
                        <button onClick={() => handleRemoveKeyword(kw)} className="hover:text-pink-500 font-extrabold text-[10px] leading-none ml-1 cursor-pointer">×</button>
                      </span>
                    ))}
                    {settings.highlightKeywords.length === 0 && (
                      <span className="text-xs text-[#a1a1aa]/60 italic font-mono uppercase">ไม่มีคีย์เวิร์ดไฮไลท์</span>
                    )}
                  </div>
                </div>

                {/* Ignored User Accounts */}
                <div className="space-y-3 pt-4 border-t border-zinc-850">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block font-mono">รายชื่อบัญชีระงับแชทหรือมิวท์</label>
                  <p className="text-[11px] text-zinc-500">ซ่อนความคิดเห็นรบกวน บอทโฆษณา หรือผู้แต่งบัญชีที่อยู่ในรายชื่อระงับการพิมพ์</p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ระบุชื่อผู้ใช้แอลเคานต์..."
                      value={ignoreInput}
                      onChange={e => setIgnoreInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddIgnored()}
                      className="flex-grow bg-[#18181b] border border-zinc-800 rounded-none px-3 py-1.5 text-xs text-white font-mono"
                    />
                    <button 
                      onClick={handleAddIgnored}
                      className="bg-[#27272a] hover:bg-[#3f3f46] text-white font-mono px-4 rounded-none text-xs"
                    >
                      ระงับ
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {settings.ignoredUsers.map(user => (
                      <span 
                        key={user} 
                        className="bg-zinc-950 text-zinc-300 px-2.5 py-1 text-xs font-mono border border-zinc-800 flex items-center gap-1.5 rounded-none"
                      >
                        @{user}
                        <button onClick={() => handleRemoveIgnored(user)} className="hover:text-red-400 ml-1" id={`remove-ignored-${user}`}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {settings.ignoredUsers.length === 0 && (
                      <span className="text-xs text-zinc-650 italic font-mono uppercase">บัญชีระงับว่างเปล่า</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Core copy link panel at the bottom of configurations */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 space-y-3 shrink-0 overflow-y-auto max-h-[380px]">
            {/* Link 1: Chat and Events */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-1.5 mb-1">
                <Sliders className="w-3.5 h-3.5" /> OBS ลิงก์ที่ 1: แชทและกิจกรรมรวมกัน
              </h4>
              <p className="text-[9.5px] text-zinc-500 font-mono uppercase mb-1.5">
                Full Overlay: Chat list + Event alerts popped on top
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-none p-2 flex items-center justify-between gap-2 overflow-hidden font-mono text-[10.5px]">
                <span className="text-zinc-450 truncate flex-1 min-w-0 pr-2">
                  {chatAlertsOverlayUrl}
                </span>
                <button 
                  onClick={copyChatToClipboard}
                  className={`py-1 px-2.5 rounded-none text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 flex-shrink-0 transition-all ${
                    copiedChat 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  }`}
                  id="copy-chat-overlay-btn"
                >
                  {copiedChat ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                  {copiedChat ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Link 2: Chat ONLY */}
            <div className="pt-2 border-t border-zinc-900/60 font-mono text-[10.5px]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono flex items-center gap-1.5 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400 animate-none" /> OBS ลิงก์ที่ 2: แสดงแชทข้อความอย่างเดียว
              </h4>
              <p className="text-[9.5px] text-zinc-500 font-mono uppercase mb-1.5">
                Chat Only: Pure chat box with NO notification banners
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-none p-2 flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-zinc-450 truncate flex-1 min-w-0 pr-2">
                  {chatOnlyOverlayUrl}
                </span>
                <button 
                  onClick={copyChatOnlyToClipboard}
                  className={`py-1 px-2.5 rounded-none text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 flex-shrink-0 transition-all ${
                    copiedChatOnly 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                  }`}
                  id="copy-chat-only-overlay-btn"
                >
                  {copiedChatOnly ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                  {copiedChatOnly ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Link 3: Alerts ONLY */}
            <div className="pt-2 border-t border-zinc-900/60 font-mono text-[10.5px]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> OBS ลิงก์ที่ 3: แสดงเตือนกิจกรรมพิเศษอย่างเดียว
              </h4>
              <p className="text-[9.5px] text-zinc-500 font-mono uppercase mb-1.5">
                Alerts Only: Followers, Likes, Gifts details ONLY without chat box
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-none p-2 flex items-center justify-between gap-2 overflow-hidden font-mono">
                <span className="text-zinc-450 truncate flex-1 min-w-0 pr-2">
                  {alertsOnlyOverlayUrl}
                </span>
                <button 
                  onClick={copyAlertsOnlyToClipboard}
                  className={`py-1 px-2.5 rounded-none text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 flex-shrink-0 transition-all ${
                    copiedAlertsOnly 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                  }`}
                  id="copy-alerts-only-overlay-btn"
                >
                  {copiedAlertsOnly ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                  {copiedAlertsOnly ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Link 4: Images ONLY */}
            <div className="pt-2 border-t border-zinc-900/60 font-mono text-[10.5px]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#da2a7a] font-mono flex items-center gap-1.5 mb-1">
                <Image className="w-3.5 h-3.5 text-pink-400" /> OBS ลิงก์ที่ 4: แสดงรูปภาพโดยเฉพาะ
              </h4>
              <p className="text-[9.5px] text-zinc-500 font-mono uppercase mb-1.5">
                Images Only: Dedicated Shared Image Showcase Overlay
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-none p-2 flex items-center justify-between gap-2 overflow-hidden">
                <span className="text-zinc-440 truncate flex-1 min-w-0 pr-2">
                  {imagesOnlyOverlayUrl}
                </span>
                <button 
                  onClick={copyImagesToClipboard}
                  className={`py-1 px-2.5 rounded-none text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 flex-shrink-0 transition-all ${
                    copiedImages 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-[#da2a7a] hover:bg-[#b01e5d] text-white shadow-sm'
                  }`}
                  id="copy-images-overlay-btn"
                >
                  {copiedImages ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                  {copiedImages ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Link 5: Stream Avatars (Walkers with Speech Bubbles) */}
            <div className="pt-2 border-t border-zinc-900/60 font-mono text-[10.5px]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-pink-500 font-mono flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-pink-500" /> OBS ลิงก์ที่ 5: แสดงตัวอวตารตกแต่งหน้าจอ (NEW)
              </h4>
              <p className="text-[9.5px] text-zinc-500 font-mono uppercase mb-1.5">
                Stream Avatars: Wander around bottom with chat bubbles above heads
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-none p-2 flex items-center justify-between gap-2 overflow-hidden font-mono">
                <span className="text-zinc-440 truncate flex-1 min-w-0 pr-2 pb-0.5">
                  {avatarsOnlyOverlayUrl}
                </span>
                <button 
                  onClick={copyAvatarsToClipboard}
                  className={`py-1 px-2.5 rounded-none text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 flex-shrink-0 transition-all ${
                    copiedAvatars 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-pink-600 hover:bg-pink-500 text-white shadow-sm'
                  }`}
                  id="copy-avatars-overlay-btn"
                >
                  {copiedAvatars ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                  {copiedAvatars ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Link 6: Falling Hearts into selectable Cup */}
            <div className="pt-2 border-t border-zinc-900/60 font-mono text-[10.5px]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 font-mono flex items-center gap-1.5 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> OBS ลิงก์ที่ 6: แก้วเก็บสะสมแต้มหัวใจ (NEW 🔥)
              </h4>
              <p className="text-[9.5px] text-zinc-500 font-mono uppercase mb-1.5">
                Hearts into interactive Cup: selected cups gather hearts when viewers click Like!
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-none p-2 flex items-center justify-between gap-2 overflow-hidden font-mono">
                <span className="text-zinc-440 truncate flex-1 min-w-0 pr-2 pb-0.5">
                  {heartsGlassOverlayUrl}
                </span>
                <button 
                  onClick={copyHeartsToClipboard}
                  className={`py-1 px-2.5 rounded-none text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 flex-shrink-0 transition-all ${
                    copiedHearts 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                  }`}
                  id="copy-hearts-overlay-btn"
                >
                  {copiedHearts ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                  {copiedHearts ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Link 7: Countdown Timer ONLY */}
            <div className="pt-2 border-t border-zinc-900/60 font-mono text-[10.5px]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> OBS ลิงก์ที่ 7: ตัวจับเวลาถอยหลังอย่างเดียว (NEW ⏱️)
              </h4>
              <p className="text-[9.5px] text-zinc-500 font-mono uppercase mb-1.5">
                Stream Timer Only: Clean styled stream counter without chat list or alerts
              </p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-none p-2 flex items-center justify-between gap-2 overflow-hidden font-mono">
                <span className="text-zinc-440 truncate flex-1 min-w-0 pr-2 pb-0.5">
                  {timerOnlyOverlayUrl}
                </span>
                <button 
                  onClick={copyTimerToClipboard}
                  className={`py-1 px-2.5 rounded-none text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 flex-shrink-0 transition-all ${
                    copiedTimer 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                  }`}
                  id="copy-timer-overlay-btn"
                >
                  {copiedTimer ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                  {copiedTimer ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <p className="text-[9.5px] text-zinc-650 font-mono text-center leading-normal uppercase pt-1 border-t border-zinc-900">
              Add any link as browser sources inside OBS to separate and layout elements!
            </p>
          </div>
        </section>

        {/* Center column live streaming simulator preview background (Span 5) */}
        <section className="xl:col-span-5 flex flex-col bg-[#0c0c0e] xl:h-full min-h-[550px] overflow-hidden border-r border-zinc-900 animate-fade-in">
          <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-900 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h2 className="text-xs font-bold tracking-widest text-[#e2e2e7] uppercase font-mono flex items-center gap-2">
                Real-time Stream Preview 
                <span className="text-[9.5px] bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-none font-bold uppercase tracking-tight">{settings.mode}</span>
              </h2>
            </div>
            
            {/* Viewport backgrounds changer */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-none">
              <button 
                onClick={() => setBackgroundType('game')}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded-none uppercase transition-all flex items-center gap-1 ${backgroundType === 'game' ? 'bg-[#7c3aed] text-white' : 'text-zinc-400 hover:text-white'}`}
                title="Mock Stream Background"
              >
                <Video className="w-3 h-3" /> Gaming
              </button>
              <button 
                onClick={() => setBackgroundType('checkerboard')}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded-none uppercase transition-all ${backgroundType === 'checkerboard' ? 'bg-[#7c3aed] text-white' : 'text-zinc-400 hover:text-white'}`}
                title="Alpha Checkerboard (OBS Transparency)"
              >
                Grid
              </button>
              <button 
                onClick={() => setBackgroundType('green')}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded-none uppercase transition-all ${backgroundType === 'green' ? 'bg-[#7c3aed] text-white' : 'text-zinc-400 hover:text-white'}`}
                title="Web Green Screen Backdrop"
              >
                Green
              </button>
              <button 
                onClick={() => setBackgroundType('dark')}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded-none uppercase transition-all ${backgroundType === 'dark' ? 'bg-[#7c3aed] text-white' : 'text-zinc-400 hover:text-white'}`}
                title="Sleek Opaque Matte Dark"
              >
                Dark
              </button>
            </div>
          </div>

          {/* Compact Viewport Frame (takes 210px height instead of flex-1 to leave space for categories and cards) */}
          <div className="h-[210px] shrink-0 relative overflow-hidden flex items-center justify-center p-3.5 bg-black/80">
            {/* Custom backdrops */}
            {backgroundType === 'checkerboard' && (
              <div 
                className="absolute inset-0 bg-slate-800/10"
                style={{
                  backgroundImage: `radial-gradient(#1e293b 20%, transparent 20%), radial-gradient(#1e293b 20%, transparent 20%)`,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px',
                  backgroundColor: '#0f172a'
                }}
              />
            )}

            {backgroundType === 'dark' && <div className="absolute inset-0 bg-slate-950" />}
            {backgroundType === 'green' && <div className="absolute inset-0 bg-emerald-600" />}
            
            {backgroundType === 'game' && (
              <div className="absolute inset-0 overflow-hidden bg-slate-950">
                <div className="absolute inset-0 opacity-45 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%]" />
                {/* Simulated colorful cyberwave visualizer animation representing stream background */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-950 to-indigo-950 animate-pulse duration-1000" />
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-indigo-900/30 via-transparent to-transparent" />
                
                {/* Visual decorations for the simulated video game HUD */}
                <div className="absolute top-3 right-4 pointer-events-none text-right font-mono text-[9px] text-slate-400/80 space-y-0.5">
                  <p>FPS: <span className="text-[#00F0FF] font-semibold">60.00</span></p>
                  <p>BITRATE: <span className="text-[#00F0FF] font-semibold">6000 kbps</span></p>
                </div>
                <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2 font-mono text-[10px] text-white/50">
                  <div className="bg-red-500 h-2 w-2 rounded-full animate-ping shrink-0" />
                  <span className="text-white font-bold tracking-wider">LIVE</span>
                </div>
              </div>
            )}

            {/* Simulated Live Viewport Overlay view container */}
            <div className="relative w-full h-full bg-transparent border border-zinc-900/60 rounded-none flex flex-col justify-end p-2.5 overflow-hidden shadow-md">
              {/* Load Overlay strictly in isDemo simulation mode */}
              <OverlayView 
                settingsOverride={settings} 
                isDemo={true} 
              />
            </div>
          </div>

          {/* =========================================================================
              GORGEOUS CATEGORIZED OBS WIDGET CATALOGUE SECTION (MATCHES SCREENSHOT)
              ========================================================================= */}
          <div className="flex-1 border-t border-zinc-900 p-4 overflow-y-auto bg-zinc-950/30 flex flex-col space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-zinc-200 flex items-center gap-1.5 font-mono">
                  <Laptop className="w-4 h-4 text-cyan-400" /> หมวดหมู่วิดเจ็ตสตรีม OBS (Widgets Library)
                </h3>
                <p className="text-[10.5px] text-zinc-500 font-sans">
                  เลือกพรีวิวจำลองบนหน้าจอ และกดคลิกคัดลอกลิงก์ Overlay ไปเพิ่มลงในเบราว์เซอร์ OBS ทันที
                </p>
              </div>
            </div>

            {/* Category selection selector */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-900/60 pb-2.5">
              {[
                { id: 'all', label: '🔌 วิดเจ็ตทั้งหมด' },
                { id: 'alerts', label: '🔔 กลุ่มแจ้งเตือนสตรีม' },
                { id: 'stats', label: '📊 แท่งเป้าหมาย & ตารางทอง' },
                { id: 'interactive', label: '🎮 บวกลบเวลามันส์ & อวตาร' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-2.5 py-1 text-[10.5px] font-sans font-extrabold transition-all duration-150 cursor-pointer ${
                    selectedCategory === cat.id 
                      ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 shadow-inner' 
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-850'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 8 Cards Grid matching photo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
              {WIDGETS_LIST.filter(widget => selectedCategory === 'all' || widget.category === selectedCategory).map((widget) => {
                const isSelected = settings.mode === widget.mode;
                const widgetUrl = buildOverlayUrl(widget.mode as any);
                const isCopied = copiedWidgetId === widget.id;
                
                // Helper to render icon matching icon_type
                const renderWidgetIcon = () => {
                  const props = { className: `w-4 h-4 text-${widget.color}-400` };
                  if (widget.icon_type === 'bell') return <Bell {...props} className="w-4 h-4 text-blue-400" />;
                  if (widget.icon_type === 'target') return <Target {...props} className="w-4 h-4 text-red-500" />;
                  if (widget.icon_type === 'award') return <Award {...props} className="w-4 h-4 text-amber-500 animate-pulse" />;
                  if (widget.icon_type === 'crown') return <Crown {...props} className="w-4 h-4 text-yellow-500 animate-bounce" />;
                  if (widget.icon_type === 'clock') return <Clock {...props} className="w-4 h-4 text-purple-400" />;
                  if (widget.icon_type === 'gift') return <Gift {...props} className="w-4 h-4 text-pink-400 animate-bounce" />;
                  if (widget.icon_type === 'stopwatch') return <Clock {...props} className="w-4 h-4 text-cyan-400" />;
                  return <Swords {...props} className="w-4 h-4 text-emerald-400 animate-pulse" />;
                };

                // Style configurations depending on selection status
                const borderClass = isSelected 
                  ? `border-cyan-500 bg-zinc-900/65 ring-1 ring-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]` 
                  : `border-zinc-900 bg-zinc-950/25 hover:border-zinc-850 hover:bg-zinc-900/10`;

                return (
                  <div
                    key={widget.id}
                    onClick={() => {
                      setSettings(prev => ({ ...prev, mode: widget.mode as any }));
                    }}
                    className={`p-3 border rounded-xl flex flex-col justify-between gap-2.5 cursor-pointer transition-all ${borderClass}`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Round colorful circle container with glow icons */}
                      <div className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center bg-zinc-900 border border-zinc-800 shadow">
                        {renderWidgetIcon()}
                      </div>
                      
                      <div className="space-y-0.5 leading-tight overflow-hidden">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-white font-sans">{widget.title_en}</h4>
                          {widget.isNew && (
                            <span className="text-[8px] tracking-wider uppercase font-mono font-black text-cyan-400 px-1 py-0.2 bg-cyan-950 border border-cyan-800/30 rounded-none animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans leading-none">{widget.title_th}</p>
                      </div>
                    </div>

                    <p className="text-[9.5px] text-zinc-500 font-sans tracking-tight leading-relaxed line-clamp-2">
                      {widget.desc}
                    </p>

                    {/* Copy and Actions segment */}
                    <div className="flex items-center gap-1.5 mt-0.5 pt-2 border-t border-zinc-900">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Copy hander
                          navigator.clipboard.writeText(widgetUrl);
                          setCopiedWidgetId(widget.id);
                          setTimeout(() => {
                            setCopiedWidgetId(null);
                          }, 2500);
                        }}
                        className={`flex-grow py-1 px-2 rounded-none font-sans text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all border ${
                          isCopied
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                            : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-850 border-zinc-800'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400 animate-pulse" /> คัดลอกลิงก์สำเร็จ!
                          </>
                        ) : (
                          <>
                            <Clipboard className="w-3 h-3 text-cyan-400" /> คัดลอกลิงก์ OBS
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Switch tabs on panel configurations for easier direct edit
                          if (widget.mode === 'timer_only') {
                            setActiveTab('general');
                          } else if (widget.mode === 'avatars') {
                            setActiveTab('avatars');
                          } else if (widget.mode === 'chat_alerts' || widget.mode === 'chat_only' || widget.mode === 'alerts_only' || widget.mode === 'images_only' || widget.mode === 'hearts_glass') {
                            setActiveTab('design');
                          }
                          setSettings(prev => ({ ...prev, mode: widget.mode as any }));
                        }}
                        className="py-1 px-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-none font-sans text-[10px] font-semibold cursor-pointer shrink-0 transition-all"
                        title="ปรับแต่งสัญลักษณ์และตัวอักษรของวิดเจ็ตนี้"
                      >
                        ปรับแต่ง
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right column: Toolbar Actions & OBS setup tutorial (Span 3) */}
        <section className="xl:col-span-3 flex flex-col bg-zinc-950 border-l border-zinc-900 h-auto xl:h-full overflow-hidden">
          <div className="flex-grow overflow-y-auto">
            {/* Stream Trial simulator */}
            <div className="p-4 border-b border-zinc-900 bg-zinc-950">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 mb-3 font-mono">
                <Play className="w-3.5 h-3.5 text-[#7c3aed]" /> แชทบอร์ดจำลองทดสอบ
              </h3>
              
              {/* Custom comment test inputs */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="เขียนข้อความทดสอบลองแชท..."
                    value={customComment}
                    onChange={e => setCustomComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && simulateCustomComment()}
                    className="flex-grow bg-zinc-900 border border-zinc-800 rounded-none px-3 py-1.5 text-xs text-white font-mono"
                  />
                  <button 
                    onClick={simulateCustomComment}
                    className="bg-indigo-600 hover:bg-indigo-500 font-bold font-mono uppercase px-3 py-1 text-white rounded-none text-[11px]"
                  >
                    ส่งแชท
                  </button>
                </div>

                {/* Grid with easy preset actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => simulateChat(false)}
                    className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-zinc-900 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all text-left text-xs font-mono uppercase text-[10.5px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> ส่งแชททั่วไป
                  </button>
                  <button 
                    onClick={() => simulateChat(true)}
                    className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-zinc-900 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all text-left text-xs font-mono uppercase text-[10.5px]"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> แชทผู้คุม (Mod)
                  </button>
                  <button 
                    onClick={simulateFollow}
                    className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-zinc-900 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all text-left text-xs font-mono uppercase text-[10.5px]"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> เหตุการณ์กดตาม
                  </button>
                  <button 
                    onClick={simulateLike}
                    className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-zinc-900 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all text-left text-xs font-mono uppercase text-[10.5px]"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" /> เหตุการณ์กดหัวใจ
                  </button>
                  <button 
                    onClick={simulateGift}
                    className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-amber-600/20 bg-zinc-950 text-amber-300 hover:bg-zinc-900/60 hover:text-white transition-all text-left text-xs col-span-2 text-[10.5px] font-mono uppercase tracking-tight"
                  >
                    <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" /> จำลองส่งของขวัญ 👑
                  </button>
                  <button 
                    onClick={simulateShare}
                    className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-lime-600/20 bg-zinc-950 text-lime-400 hover:bg-zinc-900/60 hover:text-white transition-all text-left text-xs col-span-2 text-[10.5px] font-mono uppercase tracking-tight"
                  >
                    <Share2 className="w-3.5 h-3.5 text-lime-450 shrink-0" /> จำลองคนแชร์ไลฟ์
                  </button>
                  <button 
                    onClick={simulateSendImage}
                    className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-pink-600/20 bg-zinc-950 text-pink-400 hover:bg-zinc-900/60 hover:text-white transition-all text-left text-xs col-span-2 text-[10.5px] font-mono uppercase tracking-tight"
                  >
                    <Image className="w-3.5 h-3.5 text-pink-400 shrink-0" /> จำลองผู้ชมส่งรูปภาพ 🖼️✨
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Step-By-Step OBS setup booklet */}
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-1.5 px-0.5 font-mono">
                <HelpCircle className="w-4 h-4 text-zinc-400" /> คู่มือการตั้งค่า in OBS Studio
              </h3>

              <div className="space-y-3.5 animate-none">
                {[
                  { step: '1', title: 'เพิ่มแหล่งข้อมูลบราวเซอร์', text: 'ไปที่แถบแหล่งทำงานวิดเจ็ต (Sources) ใน OBS Studio แล้วคลิกที่เครื่องหมาย + และจากนั้นเลือก "Browser" วิดเจ็ต' },
                  { step: '2', title: 'วางลิงก์ข้ามระบบจัดสรร', text: 'คัดลอกลิงก์นำไปใช้จากแอปในหน้านี้ แล้วนำพาสรุปไปวางลงในช่อง URL ตั้งค่าบราว์เซอร์ของคุณ' },
                  { step: '3', title: 'ปรับแต่งสัณฐานจอแสดงแชท', text: 'การตั้งค่ากล่องหน้าจอให้กรอกความกว้าง (Width) เป็น 450 และตั้งค่าความสูง (Height) เป็น 700 (หรือปรับขนาดตามใจชอบเพื่อความสวยงาม)' },
                  { step: '4', title: 'เสร็จเรียบร้อยไร้ขอบดำ', text: 'คลิกตกลง (OK) บับเบิ้ลแชทจะขึ้นวางมุมเรียงกันทันที หากติดขอบทึบให้ปรับลบค่าสี overlay custom ภายในช่อง OBS Browser source ออก' }
                ].map(tut => (
                  <div key={tut.step} className="flex gap-3 leading-relaxed">
                    <div className="bg-zinc-900 text-indigo-400 rounded-none font-mono text-[10px] font-bold w-5 h-5 flex items-center justify-center shrink-0 border border-zinc-800">
                      {tut.step}
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold tracking-tight text-zinc-200 mt-0.5 uppercase">{tut.title}</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-normal">{tut.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick warn card */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-none p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-zinc-450 leading-relaxed font-sans">
                  <span className="text-zinc-300 font-mono font-extrabold uppercase tracking-wide block mb-0.5">การฟื้นฟูเชื่อมต่ออัตโนมัติ</span> บราว์เซอร์ปลายทางใน OBS จะพยายามเรียกดูและเช็คพอร์ตเชื่อมต่อซ่อมแซมตัวเองโดยอัตโนมัติหากพบปัญหาติดขัดกับตัวเซิร์ฟเวอร์หลักของ IndoFinity โดยที่คุณมิต้องมารีดึงใหม่เลย!
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    ) : currentPage === 'history' ? (
      /* DONATION HISTORY PAGE */
      <div className="w-full h-full p-6 overflow-y-auto space-y-6 bg-[#07070a] font-sans pb-16">
        
        {/* Statistics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { title: 'ยอดสนับสนุนสะสมถอนได้', val: '฿15,250.00', desc: 'หักภาษี ณ ที่จ่ายเสร็จสิ้น', color: 'hover:border-[#7c3aed]/40' },
            { title: 'จำนวนผู้สนับสนุนรวม', val: '148 ราย', desc: '+12 รายในสัปดาห์นี้', color: 'hover:border-cyan-500/40' },
            { title: 'ของขวัญและป๊อปอัพ', val: '342 ครั้ง', desc: 'อัตราการป้อนข้อความ 98.2%', color: 'hover:border-pink-500/40' },
            { title: 'ชั่วโมงที่ขึ้นสตรีมรวม', val: '48.5 ชม.', desc: 'ความเสถียรเชื่อมต่อยอดเยี่ยม', color: 'hover:border-emerald-500/40' }
          ].map((stat, idx) => (
            <div key={idx} className={`bg-[#0c0c11] border border-[#161622] rounded-2xl p-5 transition-all shadow-sm ${stat.color}`}>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">{stat.title}</span>
              <span className="text-2xl font-black text-white font-mono mt-1.5 block tracking-wide">{stat.val}</span>
              <span className="text-[10px] text-zinc-450 mt-1 block">{stat.desc}</span>
            </div>
          ))}
        </div>

        {/* Detailed logs table container */}
        <div className="bg-[#0c0c11] border border-[#161622] rounded-2xl overflow-hidden shadow-md">
          <div className="px-5 py-4 border-b border-[#14141d] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0a0f]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">แผ่นรายงานการสนับสนุนล่าสุด</h3>
              <p className="text-[11px] text-zinc-500 mt-1">ประมวลผลผ่านระบบ PromptPay, TrueMoney, และเครดิตการ์ดอย่างโปร่งใส</p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-2 bg-[#12121b] p-1 border border-[#1d1d2b] rounded-lg self-start">
              <button className="px-3 py-1.5 bg-[#7c3aed] text-white text-[10px] font-bold rounded-md">
                ทั้งหมด (7)
              </button>
              <button className="px-3 py-1.5 text-zinc-400 hover:text-white text-[10px] font-medium rounded-md transition-all">
                เฉพาะเงินโดเนท
              </button>
              <button className="px-3 py-1.5 text-zinc-400 hover:text-white text-[10px] font-medium rounded-md transition-all">
                เฉพาะของขวัญ
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#141420] text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-[#0a0a0f]/40">
                  <th className="py-3 px-5">ผู้สนับสนุน</th>
                  <th className="py-3 px-5">ประเภทกิจกรรม</th>
                  <th className="py-3 px-5">ยอดเงิน / สิทธิพิเศษ</th>
                  <th className="py-3 px-5">ข้อความความคิดเห็น</th>
                  <th className="py-3 px-5 text-right">วันเวลาทำรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#13131e] text-xs">
                {[
                  { name: 'Art_Lover_99', type: 'โดเนท (PromptPay Th)', amount: '฿500.00 THB', msg: 'สตรีมสนุกมากครับ สู้ๆ พลูตู้แก้วสวยมาก! 🖼️✨', date: 'วันนี้, 23:10 น.', color: 'text-cyan-455 bg-cyan-950/40 border-cyan-800/30' },
                  { name: 'Camera_Guy', type: 'ส่งของขวัญ มงกุฎ', amount: '฿350.00 THB', msg: 'ของขวัญพิเศษ แด่สุดยอดสตรีมเมอร์แห่งปี! 👑', date: 'วันนี้, 22:45 น.', color: 'text-amber-450 bg-amber-950/40 border-amber-800/30' },
                  { name: 'Meme_Master', type: 'โดเนท (TrueMoney)', amount: '฿150.00 THB', msg: 'สตรีมเมอร์ครับ ตกใจเสียงแจ้งเตือนมาก ลั่นสตู ฮ่าๆๆ 😂', date: 'วันนี้, 22:15 น.', color: 'text-cyan-455 bg-cyan-950/40 border-cyan-800/30' },
                  { name: 'NatureExplorer', type: 'ผู้ติดตามใหม่', amount: 'สมัครสมาชิกสตรีม', msg: 'กดปุ่ม Subscribe เพื่อสนับสนุนช่องอย่างภักดี ⛰️☀️', date: 'วันนี้, 21:50 น.', color: 'text-emerald-450 bg-emerald-950/40 border-emerald-800/30' },
                  { name: 'PixelWizard', type: 'ส่งของขวัญ ไซเบอร์บอท', amount: '฿150.00 THB', msg: 'สนับสนุนคนไทยทำแอปเจ๋งๆ ลายแก้วเบียร์สวยจัด 🍺', date: 'วันนี้, 21:05 น.', color: 'text-amber-450 bg-amber-950/40 border-amber-800/30' },
                  { name: 'CoolPhotoFan', type: 'แชร์สตรีมมิ่ง', amount: 'แชร์ให้เพื่อน 2 กลุ่ม', msg: 'แชร์ห้องสตรีมไปยังกลุ่มรักคอมพิวเตอร์และแกดเจ็ตเท่ๆ!', date: 'วันนี้, 20:30 น.', color: 'text-pink-450 bg-pink-950/40 border-pink-800/30' },
                  { name: 'Princess_Zelda', type: 'โดเนท (TrueWallet)', amount: '฿1,200.00 THB', msg: 'โดเนทเป็นกำลังใจค่า ชอบอวตารน้องผีสีขาวเวฟมากเยยย 👻💕', date: 'เมื่อวาน, 18:14 น.', color: 'text-cyan-455 bg-cyan-950/40 border-cyan-800/30' }
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#11111a]/40 transition-colors">
                    <td className="py-3 px-5 font-bold text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 p-0.5">
                        <img src={mockAvatarUrls[idx % mockAvatarUrls.length]} className="w-full h-full object-cover rounded-full" />
                      </div>
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md ${item.color}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-white">{item.amount}</td>
                    <td className="py-3 px-5 text-zinc-350 max-w-sm truncate">{item.msg}</td>
                    <td className="py-3 px-5 text-right text-zinc-550 font-mono">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    ) : currentPage === 'withdraw' ? (
      /* WITHDRAW INCOME AND PAYMENTS PAGE */
      <div className="w-full h-full p-6 overflow-y-auto space-y-6 bg-[#07070a] font-sans pb-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel - withdrawal form (Span 7) */}
          <div className="lg:col-span-7 bg-[#0c0c11] border border-[#161622] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#7c3aed]" /> ขออนุมัติถอนยอดรายได้โฆษณาและโดเนท
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">
                คุณสามารถเลือกวิธีการถอนโอน เข้าบัญชีธนาคารในไทยโดยตรง หรือพร้อมเพย์ด่วน ระบบประมวลผลด่วนสูงสุด
              </p>
            </div>

            {withdrawSuccess ? (
              <div className="bg-emerald-950/45 border border-emerald-500/30 p-5 rounded-xl space-y-3.5 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500 text-black p-1.5 rounded-full mt-0.5 shadow-md">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none">บันทึกคำสั่งถอนยอดสำเร็จ!</h4>
                    <span className="text-[10px] text-zinc-500 font-mono block mt-1 tracking-tight font-bold">หมายเลขอ้างอิงคิวธนาคาร: #WD-2026-9403</span>
                    <p className="text-[11px] text-zinc-300 mt-2 leading-relaxed">
                      คำสั่งถอนจำนวนเงิน <strong className="text-white font-extrabold font-mono">฿{Number(withdrawAmount).toLocaleString()} บาท</strong> โอนเข้าเบอร์พร้อมเพย์ <strong className="text-white font-bold">{withdrawPhone}</strong> ของคุณเสร็จสมบูรณ์เรียบร้อย ทางธนาคารแห่งประเทศไทยกำลังตรวจสอบสถานะการเงิน (ปกติจะเข้าบัญชีภายใน 5-10 นาที)
                    </p>
                  </div>
                </div>
                <div className="border-t border-emerald-900/30 pt-3 flex justify-end">
                  <button 
                    onClick={() => {
                      setWithdrawSuccess(false);
                      setWithdrawAmount('2500');
                    }}
                    className="bg-[#7c3aed] text-white hover:bg-[#6d28d9] font-semibold text-xs py-1.5 px-4 rounded-lg cursor-pointer"
                  >
                    ทำรายการใหม่อีกครั้ง
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Method selector buttons */}
                <div className="space-y-2">
                  <label className="text-[10.5.px] text-zinc-400 font-bold uppercase tracking-wider font-mono">ช่องทางการรับเงิน (Payment Method)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'promptpay', title: 'PromptPay', desc: 'วินาทีต่อวินาที', active: true },
                      { id: 'kbank', title: 'กสิกรไทย', desc: 'KBANK สมาร์ท', active: false },
                      { id: 'scb', title: 'ไทยพาณิชย์', desc: 'SCB อีซี่', active: false },
                      { id: 'truewallet', title: 'TrueWallet', desc: 'ทรูวอลเล็ต', active: false }
                    ].map(bank => (
                      <button 
                        key={bank.id}
                        type="button"
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                          bank.id === 'promptpay' 
                            ? 'border-[#7c3aed] bg-[#7c3aed]/5' 
                            : 'border-[#1b1b2a] bg-[#09090c] hover:border-zinc-805'
                        }`}
                      >
                        <span className="text-xs font-extrabold text-white">{bank.title}</span>
                        <span className="text-[8.5px] text-zinc-500 mt-0.5">{bank.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase font-mono">ชื่อ-นามสกุลเจ้าของบัญชี</label>
                    <input 
                      type="text" 
                      defaultValue="ลันตา สตรีมเมอร์"
                      className="w-full bg-[#111116] border border-[#1b1b2e] rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase font-mono">หมายเลขพร้อมเพย์ / เบอร์โทรศัพท์</label>
                    <input 
                      type="text" 
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="w-full bg-[#111116] border border-[#1b1b2e] rounded-xl px-4 py-2.5 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase font-mono flex justify-between">
                    <span>ระบุมูลค่าเงินถอนออก (THB)</span>
                    <span className="text-zinc-600">ยอดย้ายออกสูงสุด: ฿15,250.00</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={withdrawAmount}
                      max="15250"
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-[#111116] border border-[#1b1b2e] rounded-xl pl-9 pr-4 py-2.5 font-mono font-bold text-sm text-cyan-400 focus:outline-none focus:border-[#7c3aed]"
                    />
                    <div className="absolute left-3.5 top-2.5 text-zinc-500 font-bold text-xs select-none">฿</div>
                  </div>
                </div>

                {/* Quick select money pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {['500', '1000', '2500', '5000', '15250'].map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setWithdrawAmount(val)}
                      className="py-1 px-3 bg-zinc-900 hover:bg-[#1c1c28] text-zinc-300 rounded text-[10px] font-mono hover:text-white border border-[#1c1c2b] cursor-pointer"
                    >
                      ฿{Number(val).toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Submit button wrapper */}
                <div className="pt-3 border-t border-[#13131e]">
                  <button
                    onClick={() => {
                      if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
                      setWithdrawSuccess(true);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#7c3aed] to-blue-600 hover:from-[#6d28d9] hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#7c3aed]/25 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer"
                  >
                    ส่งคำร้องอนุมัติการถอนเงิน <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Right panel - PromptPay dynamic QR indicator (Span 5) */}
          <div className="lg:col-span-5 bg-[#0c0c11] border border-[#161622] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-5">
            <div className="bg-[#002f5a] text-white px-3.5 py-1.5 rounded-xl border border-cyan-400/40 text-[9px] font-mono leading-none tracking-widest font-extrabold uppercase">
              Thai PromptPay Realtime
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-md relative overflow-hidden flex flex-col items-center max-w-[240px]">
              {/* Fake real QR template */}
              <div className="flex justify-between w-full items-center mb-2 text-[10px] text-[#002f5a] font-extrabold font-mono">
                <span>PROMPTPAY</span>
                <span>QR CODE</span>
              </div>
              <div className="w-[180px] h-[180px] bg-sky-50 rounded-lg p-2 flex items-center justify-center border border-sky-100">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#012d5e]">
                  {/* Generate abstract SVG QR patterns that look like real deal! */}
                  <rect x="0" y="0" width="22" height="22" fill="currentColor" />
                  <rect x="2" y="2" width="18" height="18" fill="white" />
                  <rect x="6" y="6" width="10" height="10" fill="currentColor" />
                  
                  <rect x="78" y="0" width="22" height="22" fill="currentColor" />
                  <rect x="80" y="2" width="18" height="18" fill="white" />
                  <rect x="84" y="6" width="10" height="10" fill="currentColor" />
                  
                  <rect x="0" y="78" width="22" height="22" fill="currentColor" />
                  <rect x="2" y="80" width="18" height="18" fill="white" />
                  <rect x="6" y="84" width="10" height="10" fill="currentColor" />
                  
                  {/* Miscellaneous noise squares */}
                  <rect x="30" y="2" width="8" height="14" fill="currentColor" />
                  <rect x="42" y="4" width="12" height="8" fill="currentColor" />
                  <rect x="60" y="2" width="15" height="4" fill="currentColor" />
                  <rect x="30" y="25" width="25" height="10" fill="currentColor" />
                  <rect x="60" y="15" width="10" height="30" fill="currentColor" />
                  <rect x="10" y="30" width="15" height="15" fill="currentColor" />
                  <rect x="0" y="50" width="28" height="8" fill="currentColor" />
                  <rect x="35" y="42" width="35" height="12" fill="currentColor" />
                  <rect x="75" y="50" width="25" height="25" fill="currentColor" />
                  <rect x="30" y="60" width="15" height="35" fill="currentColor" />
                  <rect x="50" y="65" width="20" height="15" fill="currentColor" />
                  <rect x="85" y="85" width="10" height="12" fill="currentColor" />
                </svg>
              </div>

              {/* Amount output */}
              <div className="mt-3 text-center">
                <span className="text-[10px] text-zinc-500 font-bold block">โอนจ่ายโฆษณา/สนับสนุนด่วน</span>
                <span className="text-xs font-black text-[#002f5a] font-mono block mt-0.5">
                  ฿{Number(withdrawAmount || 0).toLocaleString()} THB
                </span>
              </div>
            </div>

            <div className="space-y-1.5 px-3">
              <h4 className="text-[11px] font-extrabold text-zinc-200">สแกนรับโดเนทด่วนบนหน้าจอ (Dynamic QR)</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                โค้ด PromptPay QR ด้านบนถูกผูกกับระบบธนาคารแบบอัตโนมัติ สตรีมเมอร์สามารถแคปรูปภาพหน้าจอ QR นี้ นำไปแปะประกอบในหน้าวิดเจ็ตดีไซเนอร์ หรือ OBS ได้ทันที ยอดเงินผู้ชมโอนจะเข้าบัญชีโดยตรงแบบไม่ต้องเชื่อมต่อ API เพิ่ม!
              </p>
            </div>
          </div>

        </div>

      </div>
    ) : (
      /* PLATFORM INTEGRATIONS PAGE */
      <div className="w-full h-full p-6 overflow-y-auto space-y-6 bg-[#07070a] font-sans pb-16">
        
        <div className="bg-[#0c0c11] border border-[#161622] rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">แผงเชื่อมต่อเซิร์ฟเวอร์ไลฟ์สตรีม</h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              เปิดการแจ้งเตือนเสียงและเอฟเฟกต์แชทอวตารแบบไร้รอยต่อผ่านช่องทางไลฟ์ยักษ์ใหญ่ สตรีมเมอร์สามารถเปิด API ซิงค์พร้อมกันได้
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: '1', title: 'TikTok Live Connector', slug: '@tiktok-stream-webhook', status: 'เชื่อมต่อแล้ว', active: true, color: 'border-emerald-500/20 bg-emerald-950/5' },
              { id: '2', title: 'Twitch Alerts Gateway', slug: '@twitch-alert-websocket', status: 'เชื่อมต่อแล้ว', active: true, color: 'border-emerald-500/20 bg-emerald-950/5' },
              { id: '3', title: 'YouTube Stream Webhook', slug: '@youtube-live-event-feed', status: 'ไม่ได้เชื่อมต่อ', active: false, color: 'border-[#1b1b2a] bg-[#09090c]' },
              { id: '4', title: 'Facebook Gaming Events', slug: '@facebook-gaming-applet', status: 'ไม่ได้เชื่อมต่อ', active: false, color: 'border-[#1b1b2a] bg-[#09090c]' }
            ].map(plat => (
              <div key={plat.id} className={`p-4 border rounded-xl flex items-center justify-between transition-all ${plat.color}`}>
                <div>
                  <h4 className="text-xs font-bold text-white">{plat.title}</h4>
                  <span className="text-[9.5px] text-zinc-500 font-mono block mt-0.5">{plat.slug}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${
                    plat.active ? 'bg-emerald-950 text-emerald-450 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {plat.status}
                  </span>
                  <button className="text-xs bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold px-2.5 py-1 rounded-md cursor-pointer">
                    {plat.active ? 'แก้ไข' : 'เชื่อมต่อ'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Credentials guidelines */}
        <div className="bg-[#0c0c11] border border-[#161622] rounded-2xl p-6 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">คีย์ลับฝั่งนักพัฒนาสำหรับการรวม API (IndoFinity API Keys)</h4>
            <p className="text-[11px] text-zinc-500 mt-1">ใช้โทเค็นนี้ร่วมกับโปรแกรมภายนอก เช่น Companion, Stream Deck, หรือโปรแกรมยิงเสียงทอยแจ็คพอตเพื่อควบคุม</p>
          </div>
          
          <div className="bg-[#040406] border border-[#14141e] rounded-xl p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#12121e]">
              <span className="text-zinc-500 text-[10px]">API_KEY_SANDBOX</span>
              <span className="text-emerald-400 font-bold text-[10px]">active</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-zinc-350 text-[10.5px] truncate max-w-lg font-bold">
                indofinity_live_sk_89230578************103859d0a
              </span>
              <button 
                onClick={() => alert('API Key Copied!')}
                className="bg-zinc-900 border border-zinc-800 text-zinc-350 hover:bg-zinc-800 cursor-pointer hover:text-white px-2 py-1 text-[10px]"
              >
                คัดลอกคีย์
              </button>
            </div>
          </div>
        </div>

      </div>
    )}
    
        </div>
      </main>
    </div>
  );
}
