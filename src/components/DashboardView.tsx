/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Settings, Sliders, Play, Laptop, Clipboard, Check, HelpCircle, 
  MessageSquare, Heart, Gift, UserPlus, Share2, Shield, Eye, Volume2, 
  VolumeX, RefreshCw, Sparkles, AlertCircle, Trash2, ArrowRight, Video, ListFilter
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
    testChannelName: 'IndoFinity Streamer'
  });

  const [copied, setCopied] = useState(false);
  const [backgroundType, setBackgroundType] = useState<'checkerboard' | 'game' | 'dark' | 'green'>('game');
  const [customComment, setCustomComment] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [ignoreInput, setIgnoreInput] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'design' | 'audio' | 'filter'>('general');

  // Multi-lingual stream simulation payloads
  const mockComments = [
    { name: 'Sutopo_Gamer', text: 'สวัสดีครับทุกคนนน! ช่องนี้สตรีมดีมากๆ 👍', isMod: false, isSub: true },
    { name: 'Aninda_Putri', text: 'Keren banget overlay custom nya! ws nya lancar jaya mblo 🔥', isMod: true, isSub: true },
    { name: 'GamerX_In', text: 'Mabar boleh gabung ga gan? level berapa skrg?', isMod: false, isSub: false },
    { name: 'Somsak_Live', text: 'สุดยอดดด! แนะนำโปรแกรมสตรีมหน่อยครับ', isMod: false, isSub: true },
    { name: 'Rian_Finity', text: 'Testing message inline Highlight OBS keyword checking', isMod: false, isSub: false, isVip: true },
    { name: 'Aom_Pitch', text: 'แวะมาส่งของขวัญคร้าบ มีกิจกรรมอะไรวันนี้ไหมนะ 🥰', isMod: true, isSub: false },
    { name: 'Budi_Santoso', text: 'Halo bang, sukses terus stream nya! Mantap bener overlays nya 🚀', isMod: false, isSub: true }
  ];

  const mockAvatarUrls = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&fit=crop&q=80'
  ];

  const mockGifts = [
    { name: 'Rose', icon: '🌹', val: 10, pfp: mockAvatarUrls[0] },
    { name: 'Heart Sparkle', icon: '💖', val: 50, pfp: mockAvatarUrls[1] },
    { name: 'Coffee Cup', icon: '☕', val: 99, pfp: mockAvatarUrls[2] },
    { name: 'Diamond Crown', icon: '👑', val: 499, pfp: mockAvatarUrls[3] },
    { name: 'Universe Spaceship', icon: '🚀', val: 1000, pfp: mockAvatarUrls[4] }
  ];

  // Dynamically compute the URL needed for OBS Browser Source
  const generatedOverlayUrl = JSON.stringify(settings) && (() => {
    const base = window.location.origin;
    const params = new URLSearchParams();
    
    params.set('overlay', 'true');
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
    params.set('ttsVoicePitch: ', settings.ttsVoicePitch.toString());
    params.set('animationStyle', settings.animationStyle);
    
    if (settings.highlightKeywords.length > 0) {
      params.set('highlightKeywords', settings.highlightKeywords.join(','));
    }
    if (settings.ignoredUsers.length > 0) {
      params.set('ignoredUsers', settings.ignoredUsers.join(','));
    }

    return `${base}/?${params.toString()}`;
  })();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedOverlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
              <span className="text-[9px] bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-mono tracking-widest px-1.5 py-0.5 rounded-none uppercase font-bold">OBS WIDGET</span>
            </h1>
            <p className="text-xs text-zinc-400 font-sans tracking-wide">Stream-optimized beautiful custom message styling and alerts overlay tool</p>
          </div>
        </div>

        {/* Real-time Socket Indicator status */}
        <div className="flex items-center gap-3.5 bg-zinc-900/40 border border-zinc-800/80 px-3.5 py-1.5 rounded-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-widest">STUDIO ENGINE ACTIVE</span>
          </div>
          <span className="text-zinc-800">|</span>
          <span className="text-xs text-zinc-400 font-mono tracking-tight">WS Port: 62024</span>
        </div>
      </header>

      {/* Main Grid: Control Panel (Left), Simulated Stream Backdrop (Center), Stream Control Panel (Right) */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden max-h-[calc(100vh-69px)]">
        {/* Left column config workspace (Span 4) */}
        <section className="xl:col-span-4 border-r border-zinc-900 bg-zinc-950/40 flex flex-col overflow-y-auto">
          {/* Tabs for settings */}
          <div className="flex border-b border-zinc-900 shrink-0 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider font-bold">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex-grow py-3 text-center border-b-2 items-center justify-center gap-1.5 flex transition-all ${
                activeTab === 'general' ? 'border-indigo-500 text-white bg-zinc-900/40' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Layout
            </button>
            <button 
              onClick={() => setActiveTab('design')}
              className={`flex-grow py-3 text-center border-b-2 items-center justify-center gap-1.5 flex transition-all ${
                activeTab === 'design' ? 'border-[#7c3aed] text-white bg-zinc-900/40' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Themes
            </button>
            <button 
              onClick={() => setActiveTab('audio')}
              className={`flex-grow py-3 text-center border-b-2 items-center justify-center gap-1.5 flex transition-all ${
                activeTab === 'audio' ? 'border-amber-500 text-white bg-zinc-900/40' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" /> Audio
            </button>
            <button 
              onClick={() => setActiveTab('filter')}
              className={`flex-grow py-3 text-center border-b-2 items-center justify-center gap-1.5 flex transition-all ${
                activeTab === 'filter' ? 'border-rose-500 text-white bg-zinc-900/40' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Filters
            </button>
          </div>

          <div className="p-5 flex-1 space-y-6">
            {/* GENERAL LAYOUT TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* WebSocket Destination */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center justify-between">
                    <span>IndoFinity WebSocket Feed URL</span>
                    <span className="text-[10px] text-zinc-500 font-mono normal-case">Streaming proxy target</span>
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
                    Default: <code className="text-zinc-300 font-mono bg-zinc-900 px-1 py-0.5 border border-zinc-800 rounded-none">ws://localhost:62024</code> for IndoFinity local stream services.
                  </p>
                </div>

                {/* Font Size controls */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    <span>Base Font Size</span>
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
                    <span>Max Messages Stack</span>
                    <span className="font-mono text-indigo-400">{settings.maxMessages} items</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="25" 
                    value={settings.maxMessages}
                    onChange={e => setSettings(prev => ({ ...prev, maxMessages: Number(e.target.value) }))}
                    className="w-full accent-indigo-500 h-1 bg-zinc-800 appearance-none cursor-pointer rounded-none"
                  />
                  <p className="text-[11px] text-zinc-500">Truncates old comments to keep stream gameplay tidy.</p>
                </div>

                {/* Lifetime settings */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    <span>Disappear Timeout</span>
                    <span className="font-mono text-indigo-400">
                      {settings.messageLifetime === 0 ? 'Indefinite (No Auto-Fade)' : `${settings.messageLifetime} seconds`}
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
                  <p className="text-[11px] text-zinc-500">Hides comment bubbles after a delay to keep the game screen completely clear when inactive.</p>
                </div>

                {/* Switch Controls */}
                <div className="space-y-3.5 pt-4.5 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold tracking-wide text-zinc-200">SHOW USER AVATARS</h4>
                      <p className="text-[11px] text-zinc-500">Renders platform-native profile pictures</p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, showAvatars: !prev.showAvatars }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        settings.showAvatars ? 'bg-indigo-600 justify-end' : 'bg-zinc-800 justify-start'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold tracking-wide text-zinc-200">SHOW STREAMER BADGES</h4>
                      <p className="text-[11px] text-zinc-500">Renders Moderator, Subscriber and VIP tags</p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, showBadges: !prev.showBadges }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        settings.showBadges ? 'bg-indigo-600 justify-end' : 'bg-zinc-800 justify-start'
                      }`}
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
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Select Overlay Visual Theme Preset</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'geometric', label: 'Geometric Balance', desc: 'Sleek sharp panels, modern tech lines' },
                      { id: 'cyberpunk', label: 'Cyberpunk Neon', desc: 'Neon pink, glowing cyan borders' },
                      { id: 'glassmorphism', label: 'Elegant Glass', desc: 'Translucent frosted glass' },
                      { id: 'bubblechat', label: 'Rounded Bubble', desc: 'Classic compact conversation look' },
                      { id: 'twitch', label: 'Twitch Clean', desc: 'Pitch dark blocks, vivid names' },
                      { id: 'retro', label: 'Retro 8-Bit', desc: 'Monochrome pixel terminal' },
                      { id: 'minimal', label: 'Minimal Stream', desc: 'Subtle overlays, bare text list' }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, theme: theme.id as OverlayTheme }))}
                        className={`p-3.5 rounded-sm text-left border cursor-pointer hover:border-indigo-500 hover:bg-zinc-900/60 transition-all ${
                          settings.theme === theme.id 
                            ? 'bg-zinc-900/40 border-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.15)]' 
                            : 'bg-zinc-950/20 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <h4 className={`text-xs font-mono font-bold ${settings.theme === theme.id ? 'text-white' : 'text-zinc-300'}`}>{theme.label}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{theme.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation Style Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Incoming Entrance Animation</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'slide-up', label: 'Elevate Stack', desc: 'Slides up and expands' },
                      { id: 'slide-left', label: 'Lateral Slide', desc: 'Flies in from the right' },
                      { id: 'fade-in', label: 'Soft Dissolve', desc: 'Gradual glow fade' },
                      { id: 'scale-pop', label: 'Bouncy Pop', desc: 'Elastic bubble scale' }
                    ].map(style => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, animationStyle: style.id as any }))}
                        className={`px-3 py-2 rounded-lg text-left text-xs font-semibold border transition-all ${
                          settings.animationStyle === style.id 
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AUDIO & SPEECH TAB */}
            {activeTab === 'audio' && (
              <div className="space-y-5">
                {/* Audio chime toggle */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-900/40 border border-zinc-800 rounded-none">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-zinc-100 flex items-center gap-1.5 uppercase transition-colors">
                      {settings.alertSounds ? <Volume2 className="text-amber-400 w-4 h-4" /> : <VolumeX className="text-zinc-500 w-4 h-4" />}
                      App Synthesizer Sounds
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Play pop clicks and ding alerts internally</p>
                  </div>
                  <button 
                    onClick={() => setSettings(prev => ({ ...prev, alertSounds: !prev.alertSounds }))}
                    className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                      settings.alertSounds ? 'bg-amber-600 justify-end' : 'bg-zinc-850 justify-start'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 bg-white" />
                  </button>
                </div>

                {/* Text To Speech Config */}
                <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-none space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold text-zinc-100 uppercase">Live Text-To-Speech (TTS)</h4>
                      <p className="text-[11px] text-[#a1a1aa]">Read incoming comments out loud</p>
                    </div>
                    <button 
                      onClick={() => setSettings(prev => ({ ...prev, textToSpeech: !prev.textToSpeech }))}
                      className={`w-10 h-5.5 rounded-none flex items-center p-1 cursor-pointer transition-colors ${
                        settings.textToSpeech ? 'bg-indigo-600 justify-end' : 'bg-zinc-850 justify-start'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 bg-white" />
                    </button>
                  </div>

                  {settings.textToSpeech && (
                    <div className="space-y-3 pt-3 border-t border-zinc-800">
                      {/* TTS rate slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-400 leading-none">
                          <span>Speech Pace/Rate</span>
                          <span>{settings.ttsVoiceRate}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="2.0" 
                          step="0.1"
                          value={settings.ttsVoiceRate}
                          onChange={e => setSettings(prev => ({ ...prev, ttsVoiceRate: Number(e.target.value) }))}
                          className="w-full accent-indigo-500 h-1 bg-zinc-800 appearance-none cursor-pointer rounded-none"
                        />
                      </div>

                      {/* TTS pitch slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-400 leading-none">
                          <span>Vocal Pitch</span>
                          <span>{settings.ttsVoicePitch}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="1.5" 
                          step="0.1"
                          value={settings.ttsVoicePitch}
                          onChange={e => setSettings(prev => ({ ...prev, ttsVoicePitch: Number(e.target.value) }))}
                          className="w-full accent-indigo-500 h-1 bg-zinc-800 appearance-none cursor-pointer rounded-none"
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block font-mono">Keyword Visual Highlights</label>
                  <p className="text-[11px] text-zinc-500">Comments featuring these words flash a special glowing overlay card in your feed.</p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add trigger word (e.g. raid)..."
                      value={keywordInput}
                      onChange={e => setKeywordInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-none px-3 py-1.5 text-xs text-white uppercase font-mono"
                    />
                    <button 
                      onClick={handleAddKeyword}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono px-4 rounded-none text-xs"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {settings.highlightKeywords.map(kw => (
                      <span key={kw} className="bg-indigo-950/40 border border-indigo-900/60 text-indigo-300 text-[10.5px] font-mono px-2 py-0.5 rounded-none flex items-center gap-1 uppercase">
                        {kw}
                        <button onClick={() => handleRemoveKeyword(kw)} className="hover:text-red-400 ml-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {settings.highlightKeywords.length === 0 && (
                      <span className="text-xs text-zinc-600 italic font-mono uppercase">No active highlights</span>
                    )}
                  </div>
                </div>

                {/* Ignored User Accounts */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block font-mono">Muted User Identifiers</label>
                  <p className="text-[11px] text-zinc-500">Suppress comments from spam bots or blocklisted accounts.</p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter username handle..."
                      value={ignoreInput}
                      onChange={e => setIgnoreInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddIgnored()}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-none px-3 py-1.5 text-xs text-white font-mono"
                    />
                    <button 
                      onClick={handleAddIgnored}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white font-mono px-4 rounded-none text-xs"
                    >
                      Mute
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {settings.ignoredUsers.map(user => (
                      <span key={user} className="bg-zinc-900/80 border border-zinc-800 text-zinc-350 text-[10.5px] font-mono px-2 py-0.5 rounded-none flex items-center gap-1">
                        @{user}
                        <button onClick={() => handleRemoveIgnored(user)} className="hover:text-red-400 ml-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {settings.ignoredUsers.length === 0 && (
                      <span className="text-xs text-zinc-650 italic font-mono uppercase">Mute list empty</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Core copy link panel at the bottom of configurations */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-450 font-mono">OBS Browser Source URL</h4>
            <div className="bg-zinc-900 border border-zinc-800 rounded-none p-2 flex items-center justify-between gap-2 overflow-hidden">
              <span className="font-mono text-[11px] text-zinc-400 truncate flex-1 min-w-0 pr-2">
                {generatedOverlayUrl}
              </span>
              <button 
                onClick={copyToClipboard}
                className={`py-1.5 px-3 rounded-none text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 flex-shrink-0 transition-all ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-zinc-550 font-mono text-center leading-normal uppercase">
              Drag & copy this link into OBS Studio as a browser source.
            </p>
          </div>
        </section>

        {/* Center column live streaming simulator preview background (Span 5) */}
        <section className="xl:col-span-5 flex flex-col bg-[#0c0c0e] h-full overflow-hidden border-r border-zinc-900">
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
        <section className="xl:col-span-3 flex flex-col bg-zinc-950 border-l border-zinc-900 overflow-y-auto">
          {/* Stream Trial simulator */}
          <div className="p-4 border-b border-zinc-900 bg-zinc-950">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 mb-3 font-mono">
              <Play className="w-3.5 h-3.5 text-[#7c3aed]" /> Chat Test Simulator
            </h3>
            
            {/* Custom comment test inputs */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Draft trial comment message..."
                  value={customComment}
                  onChange={e => setCustomComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && simulateCustomComment()}
                  className="flex-grow bg-zinc-900 border border-zinc-800 rounded-none px-3 py-1.5 text-xs text-white font-mono"
                />
                <button 
                  onClick={simulateCustomComment}
                  className="bg-indigo-600 hover:bg-indigo-500 font-bold font-mono uppercase px-3 py-1 text-white rounded-none text-[11px]"
                >
                  Send
                </button>
              </div>

              {/* Grid with easy preset actions */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => simulateChat(false)}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-zinc-900 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all text-left text-xs font-mono uppercase text-[10.5px]"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Chat
                </button>
                <button 
                  onClick={() => simulateChat(true)}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-zinc-900 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all text-left text-xs font-mono uppercase text-[10.5px]"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Mod
                </button>
                <button 
                  onClick={simulateFollow}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-zinc-900 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all text-left text-xs font-mono uppercase text-[10.5px]"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Follow
                </button>
                <button 
                  onClick={simulateLike}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-zinc-900 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all text-left text-xs font-mono uppercase text-[10.5px]"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" /> Like
                </button>
                <button 
                  onClick={simulateGift}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-amber-600/20 bg-zinc-950 text-amber-300 hover:bg-zinc-900/60 hover:text-white transition-all text-left text-xs col-span-2 text-[10.5px] font-mono uppercase tracking-tight"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Gift Alert 👑
                </button>
                <button 
                  onClick={simulateShare}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-none border border-lime-600/20 bg-zinc-950 text-lime-400 hover:bg-zinc-900/60 hover:text-white transition-all text-left text-xs col-span-2 text-[10.5px] font-mono uppercase tracking-tight"
                >
                  <Share2 className="w-3.5 h-3.5 text-lime-450 shrink-0" /> Share Alert
                </button>
              </div>
            </div>
          </div>

          {/* Quick Step-By-Step OBS setup booklet */}
          <div className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-1.5 px-0.5 font-mono">
              <HelpCircle className="w-4 h-4 text-zinc-400" /> OBS Setup Guide
            </h3>

            <div className="space-y-3.5 animate-none">
              {[
                { step: '1', title: 'Add Browser Source', text: 'In OBS Studio Sources dock, click the + symbol and select "Browser" source.' },
                { step: '2', title: 'Paste Configured URL', text: 'Copy the OBS overlay source link from this page and paste it in the URL setting field.' },
                { step: '3', title: 'Adjust Screen Bounds', text: 'Configure Width to 450 and Height to 700 (or 1920x1080 for full canvas placement).' },
                { step: '4', title: 'Done & Custom CSS', text: 'Click OK. Chat bubble layers will align dynamically. If background has color, make sure CSS in OBS settings has no custom overriding backgrounds.' }
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
                <span className="text-zinc-300 font-mono font-extrabold uppercase tracking-wide block mb-0.5">Self-Healing Sync</span> The browser source automatically attempts Connection reconnects should your local IndoFinity service experience intermittent interruptions. No manual resets needed!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
