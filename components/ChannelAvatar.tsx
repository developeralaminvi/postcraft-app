'use client';

import React from 'react';
import { Facebook, Instagram, Linkedin, Globe } from 'lucide-react';

export interface ChannelAvatarProps {
  avatar?: string | null;
  name: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

export default function ChannelAvatar({
  avatar,
  name,
  platform,
  size = 'md',
  showBadge = true,
  className = '',
}: ChannelAvatarProps) {
  const normPlatform = (platform || '').toUpperCase();

  // Size definitions for container, avatar, and badge
  const sizeMap = {
    xs: {
      container: 'w-6 h-6',
      badge: 'w-3 h-3 -bottom-0.5 -right-0.5 border-[1px]',
      badgeIcon: 'w-1.5 h-1.5',
      text: 'text-[9px]',
    },
    sm: {
      container: 'w-8 h-8',
      badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5 border-[1.5px]',
      badgeIcon: 'w-2 h-2',
      text: 'text-[11px]',
    },
    md: {
      container: 'w-10 h-10',
      badge: 'w-4 h-4 -bottom-0.5 -right-0.5 border-[1.5px]',
      badgeIcon: 'w-2.5 h-2.5',
      text: 'text-xs',
    },
    lg: {
      container: 'w-12 h-12',
      badge: 'w-5 h-5 -bottom-1 -right-1 border-2',
      badgeIcon: 'w-3 h-3',
      text: 'text-sm',
    },
    xl: {
      container: 'w-14 h-14',
      badge: 'w-5.5 h-5.5 -bottom-1 -right-1 border-2',
      badgeIcon: 'w-3.5 h-3.5',
      text: 'text-base',
    },
  };

  const s = sizeMap[size] || sizeMap.md;

  const renderBadgeIcon = () => {
    if (normPlatform === 'WORDPRESS') {
      return (
        <span
          className={`absolute ${s.badge} rounded-full bg-[#21759B] text-white flex items-center justify-center border-white shadow-xs z-10 flex-shrink-0`}
          title="WordPress"
        >
          <Globe className={s.badgeIcon} />
        </span>
      );
    }
    if (normPlatform === 'LINKEDIN') {
      return (
        <span
          className={`absolute ${s.badge} rounded-full bg-[#0A66C2] text-white flex items-center justify-center border-white shadow-xs z-10 flex-shrink-0`}
          title="LinkedIn"
        >
          <Linkedin className={s.badgeIcon} />
        </span>
      );
    }
    if (normPlatform === 'INSTAGRAM') {
      return (
        <span
          className={`absolute ${s.badge} rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center border-white shadow-xs z-10 flex-shrink-0`}
          title="Instagram"
        >
          <Instagram className={s.badgeIcon} />
        </span>
      );
    }
    // Default Facebook
    return (
      <span
        className={`absolute ${s.badge} rounded-full bg-[#1877F2] text-white flex items-center justify-center border-white shadow-xs z-10 flex-shrink-0`}
        title="Facebook"
      >
        <Facebook className={s.badgeIcon} />
      </span>
    );
  };

  const initials = (name || 'SC')
    .replace(/^@/, '')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`relative inline-block flex-shrink-0 ${s.container} ${className}`}>
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-full h-full rounded-full object-cover border border-slate-200 shadow-2xs"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-bold text-white shadow-2xs ${
            normPlatform === 'WORDPRESS'
              ? 'bg-[#21759B]'
              : normPlatform === 'LINKEDIN'
              ? 'bg-[#0A66C2]'
              : normPlatform === 'INSTAGRAM'
              ? 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600'
              : 'bg-[#1877F2]'
          } ${s.text}`}
        >
          {initials}
        </div>
      )}

      {showBadge && renderBadgeIcon()}
    </div>
  );
}
