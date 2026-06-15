/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OverlayTheme = 'geometric' | 'cyberpunk' | 'glassmorphism' | 'bubblechat' | 'minimal' | 'retro' | 'twitch' | 'neon-glow' | 'kawaii' | 'gaming-red' | 'royal-gold' | 'cosmic-nebula' | 'futuristic-holo' | 'luxury-obsidian' | 'vintage-journal' | 'pastel-candy' | 'cozy-cloud' | 'aesthetic-snow' | 'aesthetic-sakura' | 'multistream-k';

export type GlassType = 'wine' | 'beaker' | 'beer' | 'cocktail' | 'wish-jar';

export interface OverlaySettings {
  wsUrl: string;
  theme: OverlayTheme;
  fontSize: number; // in px
  maxMessages: number;
  messageLifetime: number; // in seconds, 0 means permanent
  showAvatars: boolean;
  showBadges: boolean;
  alertSounds: boolean;
  alertPosition?: 'top-center' | 'middle';
  textToSpeech: boolean;
  ttsVoiceRate: number;
  ttsVoicePitch: number;
  ttsVoiceName?: string;
  ttsEngine?: 'browser' | 'google' | 'google_cloud_premium';
  ttsApiKey?: string;
  ttsReadChat?: boolean;
  ttsReadGift?: boolean;
  ttsReadFollow?: boolean;
  ttsReadShareImage?: boolean;
  ttsSkipNickname?: boolean;
  highlightKeywords: string[];
  ignoredUsers: string[];
  animationStyle: 'slide-up' | 'slide-left' | 'fade-in' | 'scale-pop';
  testChannelName: string;
  showImageAlerts?: boolean; // toggle separate image alerts tray
  mode?: 'chat_alerts' | 'images_only' | 'chat_only' | 'alerts_only' | 'avatars' | 'all' | 'hearts_glass' | 'timer_only' | 'donate_goal' | 'leaderboard';
  glassType?: GlassType;
  customAvatars?: Array<{ id: string; name: string; spriteUrl: string; scale?: number }>;
  vectorAvatarSpeed?: number;
  hideAvatarsWhenNoViewers?: boolean;
  testViewerCount?: number;
  hideWhenIdle?: boolean;
  idleTimeout?: number; // in seconds, hides avatars if no chat/activity
  spawnOnlyOnActivity?: boolean; // if true, do not spawn default walk avatars initially, wait for incoming activity
  showWalkingAvatars?: boolean; // toggle absolute display of stream walking avatars
  maxVisitorAvatars?: number; // maximum simultaneous transient visitor avatars on screen
  fontFamily?: string; // custom Google Font or system font
  showTimer?: boolean; // display countdown timer
  timerDuration?: number; // initial duration in seconds
  timerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center'; // position of the timer
  timerOnlyNumbers?: boolean; // display only numbers without container box or extra labels
  timerGlowColor?: 'cyan' | 'pink' | 'orange-gold' | 'white-3d' | 'green-matrix' | 'neon-purple' | 'crimson' | 'voltage' | 'cotton-candy' | 'platinum-diamond'; // glow style of naked transparent timer
  timerFontSize?: number; // customized font size for the stream timer
  timerFontFamily?: string; // custom digital font family for countdown timer digits
  timerIcon?: string; // emoji or prefix icon for the timer
  timerLabel?: string; // customizable title/text above the clock
  layoutOrientation?: 'vertical' | 'horizontal'; // orientation of the chat messages
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  type: 'chat' | 'gift' | 'like' | 'follow' | 'share' | 'share_image' | 'donate_alert';
  uniqueId: string; // @handle
  nickname: string; // friendly name
  comment?: string; // chat message text
  profilePictureUrl?: string; // avatar
  imageUrl?: string; // sent photo/image URL
  amount?: number; // donation amount
  
  // Badges
  isModerator?: boolean;
  isSubscriber?: boolean;
  isVip?: boolean;

  // Gift details
  giftName?: string;
  giftIcon?: string;
  repeatCount?: number;
  diamondCount?: number;

  // Like details
  likeCount?: number;
}

export interface AlertEvent {
  id: string;
  type: 'gift' | 'like' | 'follow' | 'share' | 'donate_alert';
  uniqueId: string;
  nickname: string;
  profilePictureUrl?: string;
  detailText: string;
  amount?: number;
  timestamp: number;
}
