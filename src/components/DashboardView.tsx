/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Settings, Sliders, Play, Laptop, Clipboard, Check, HelpCircle, 
  MessageSquare, Heart, Gift, UserPlus, Share2, Shield, Eye, Volume2, 
  VolumeX, RefreshCw, Sparkles, AlertCircle, Trash2, ArrowRight, Video, ListFilter, Image
} from 'lucide-react';
import { OverlaySettings, OverlayTheme, ChatMessage } from '../types';
import OverlayView from './OverlayView';

export default function DashboardView() {
  const [settings, setSettings] = useState<OverlaySettings>({
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
    highlightKeywords: ['obs', 'indofinity', 'stream', 'highlight'],
    ignoredUsers: [],
    animationStyle: 'slide-up',
    testChannelName: 'IndoFinity Streamer',
    showImageAlerts: true
  });

  const [copiedChat, setCopiedChat] = useState(false);
  const [copiedChatOnly, setCopiedChatOnly] = useState(false);
  const [copiedAlertsOnly, setCopiedAlertsOnly] = useState(false);
  const [copiedImages, setCopiedImages] = useState(false);
  const [backgroundType, setBackgroundType] = useState<'checkerboard' | 'game' | 'dark' | 'green'>('game');
  const [customComment, setCustomComment] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [ignoreInput, setIgnoreInput] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'design' | 'audio' | 'filter'>('general');

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
  const buildOverlayUrl = (mode: 'chat_alerts' | 'images_only' | 'chat_only' | 'alerts_only') => {
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
    params.set('animationStyle', settings.animationStyle);
    params.set('showImageAlerts', (settings.showImageAlerts !== false).toString());
    
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
      uniqueId: 'rich_gifter_' + Math.floor(Math.random() * 90 + 10),
      nickname: 'Vip_Gifter_' + repeat,
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
      uniqueId: 'new_follower_' + Math.floor(Math.random() * 900 + 100),
      nickname: 'Follower_Friend_' + randomIdx,
      profilePictureUrl: settings.showAvatars ? mockAvatarUrls[randomIdx] : undefined
    });
  };

  const simulateLike = () => {
    const randomIdx = Math.floor(Math.random() * mockAvatarUrls.length);
    sendSimulatedEvent({
      type: 'like',
      uniqueId: 'liker_' + Math.floor(Math.random() * 900 + 100),
      nickname: 'Liker_Fan_' + randomIdx,
      profilePictureUrl: settings.showAvatars ? mockAvatarUrls[randomIdx] : undefined,
      likeCount: Math.floor(Math.random() * 12) + 1
    });
  };

  const simulateShare = () => {
    const randomIdx = Math.floor(Math.random() * mockAvatarUrls.length);
    sendSimulatedEvent({
      type: 'share',
      uniqueId: 'sharer_' + Math.floor(Math.random() * 9000),
      nickname: 'Share_Buddy_' + randomIdx,
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
    <div className="min-h-screen bg-[#0c0c0e] text-[#e2e2e7] flex flex-col font-sans select-none" id="stream-designer">
      {/* Top Header of Design Panel */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-sm text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-mono font-bold tracking-tight text-white flex items-center gap-2">
              IndoFinity.Stream<span className="font-extrabold text-[#7c3aed]">Overlay</span>
              <span className="text-[9px] bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-mono tracking-widest px-1.5 py-0.5 rounded-none uppercase font-bold">OBS วิดเจ็ต</span>
            </h1>
            <p className="text-xs text-zinc-400 font-sans tracking-wide">เครื่องมือปรับแต่งสไตล์ข้อความและการแจ้งเตือนบนหน้าจออย่างสวยงามสำหรับสตรีมที่เสถียรที่สุด</p>
          </div>
        </div>

        {/* Real-time Socket Indicator status */}
        <div className="flex items-center gap-3.5 bg-zinc-900/40 border border-zinc-800/80 px-3.5 py-1.5 rounded-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-widest">ระบบสตูดิโอทำงานอยู่</span>
          </div>
          <span className="text-zinc-800">|</span>
          <span className="text-xs text-zinc-400 font-mono tracking-tight">พอร์ต WS: 62024</span>
        </div>
      </header>

      {/* Main Grid: Control Panel (Left), Simulated Stream Backdrop (Center), Stream Control Panel (Right) */}
      <div className="flex-grow grid grid-cols-1 xl:grid-cols-12 xl:overflow-hidden xl:h-[calc(100vh-69px)] overflow-y-auto">
        {/* Left column config workspace (Span 4) */}
        <section className="xl:col-span-4 border-r border-zinc-900 bg-zinc-950/40 flex flex-col h-auto xl:h-full overflow-hidden">
          {/* Tabs for settings */}
          <div className="flex border-b border-zinc-900 shrink-0 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider font-bold">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex-grow py-3 text-center border-b-2 items-center justify-center gap-1.5 flex transition-all ${
                activeTab === 'general' ? 'border-indigo-500 text-white bg-zinc-900/40' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> การจัดวาง
            </button>
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex-grow py-3 text-center border-b-2 items-center justify-center gap-1.5 flex transition-all ${
                activeTab === 'design' ? 'border-[#7c3aed] text-white bg-zinc-900/40' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> ธีมแสดงแชท
            </button>
            <button 
              onClick={() => setActiveTab('audio')}
              className={`flex-grow py-3 text-center border-b-2 items-center justify-center gap-1.5 flex transition-all ${
                activeTab === 'audio' ? 'border-amber-500 text-white bg-zinc-900/40' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" /> ปรับค่าเสียง
            </button>
            <button 
              onClick={() => setActiveTab('filter')}
              className={`flex-grow py-3 text-center border-b-2 items-center justify-center gap-1.5 flex transition-all ${
                activeTab === 'filter' ? 'border-rose-500 text-white bg-zinc-900/40' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> ตัวกรองแชท
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-6">
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
              </div>
            )}

            {/* DESIGN THEMES TAB */}
            {activeTab === 'design' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">เลือกรูปแบบธีมแสดงข้อความบนหน้าจอ (Overlay)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'geometric', label: 'สมมาตรทรงเรขาคณิต', desc: 'ดีไซน์แผงมุมเหลี่ยมขอบเฉี่ยว, พัฒนาแนวยานยนต์ไฮเทค' },
                      { id: 'cyberpunk', label: 'นีออนไซเบอร์พังก์', desc: 'โทนสีชมพูนีออนสลับคู่ขอบสว่างสดใสเด่นชัด' },
                      { id: 'glassmorphism', label: 'กระจกฝ้าหรูหรา', desc: 'หน้าต่างกล่องแชทโปร่งใสมีเอฟเฟกต์เบลอหลัง' },
                      { id: 'bubblechat', label: 'กล่องแชทแบบโค้งมน', desc: 'รูปแบบการสนทนาขอบมนกลมแบบดั้งเดิมลื่นไหล' },
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

            <p className="text-[9.5px] text-zinc-650 font-mono text-center leading-normal uppercase pt-1 border-t border-zinc-900">
              Add any link as browser sources inside OBS to separate and layout elements!
            </p>
          </div>
        </section>

        {/* Center column live streaming simulator preview background (Span 5) */}
        <section className="xl:col-span-5 flex flex-col bg-[#0c0c0e] xl:h-full min-h-[550px] overflow-hidden border-r border-zinc-900">
          <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-900 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold tracking-widest text-[#e2e2e7] uppercase font-mono">Real-time Stream Preview</h2>
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

          {/* Preview canvas wrapping simulator container */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
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
                <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%]" />
                {/* Simulated colorful cyberwave visualizer animation representing stream background */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-950 to-indigo-950 animate-pulse duration-1000" />
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-indigo-900/30 via-transparent to-transparent" />
                
                {/* Visual decorations for the simulated video game HUD */}
                <div className="absolute top-4 right-4 pointer-events-none text-right font-mono text-[10px] text-slate-400/80 space-y-0.5">
                  <p>FPS: <span className="text-[#00F0FF] font-semibold">60.00</span></p>
                  <p>BITRATE: <span className="text-pink-500 font-semibold">6000 kbps</span></p>
                  <p>ENCODER: NVENC H.264</p>
                </div>
                <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 font-mono text-[11px] text-white/50">
                  <div className="bg-red-500 h-2.5 w-2.5 rounded-full animate-ping shrink-0" />
                  <span className="text-white font-bold text-xs tracking-wider">LIVE</span>
                  <span className="text-slate-400">01:42:09</span>
                </div>
              </div>
            )}

            {/* Simulated Live Viewport Overlay view container */}
            <div className="relative w-full h-full max-h-[580px] bg-transparent border border-zinc-900 rounded-none flex flex-col justify-end p-4 overflow-hidden shadow-md">
              {/* Load Overlay strictly in isDemo simulation mode, binding to user styles dynamically */}
              <OverlayView settingsOverride={settings} isDemo={true} />
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
    </div>
  );
}
