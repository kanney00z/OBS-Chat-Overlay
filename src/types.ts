/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OverlayTheme = 'geometric' | 'cyberpunk' | 'glassmorphism' | 'bubblechat' | 'minimal' | 'retro' | 'twitch' | 'neon-glow' | 'kawaii' | 'gaming-red' | 'royal-gold';

export interface OverlaySettings {
  wsUrl: string;
  theme: OverlayTheme;
  fontSize: number; // in px
  maxMessages: number;
  messageLifetime: number; // in seconds, 0 means permanent
  showAvatars: boolean;
  showBadges: boolean;
  alertSounds: boolean;
  textToSpeech: boolean;
  ttsVoiceRate: number;
  ttsVoicePitch: number;
  highlightKeywords: string[];
  ignoredUsers: string[];
  animationStyle: 'slide-up' | 'slide-left' | 'fade-in' | 'scale-pop';
  testChannelName: string;
  showImageAlerts?: boolean; // toggle separate image alerts tray
  mode?: 'chat_alerts' | 'images_only' | 'chat_only' | 'alerts_only' | 'all';
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  type: 'chat' | 'gift' | 'like' | 'follow' | 'share' | 'share_image';
  uniqueId: string; // @handle
  nickname: string; // friendly name
  comment?: string; // chat message text
  profilePictureUrl?: string; // avatar
  imageUrl?: string; // sent photo/image URL
  
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
  type: 'gift' | 'like' | 'follow' | 'share';
  uniqueId: string;
  nickname: string;
  profilePictureUrl?: string;
  detailText: string;
  timestamp: number;
}
