import React from 'react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

export function FacebookBrandIcon({ className = 'w-10 h-10', size }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="24" fill="#1877F2" />
      <path
        d="M29.5 25.5H25V39H19V25.5H16V20.5H19V17C19 13.9 20.8 11.5 25.2 11.5C26.9 11.5 28.5 11.8 28.5 11.8V16.6H26.4C24.7 16.6 24.2 17.5 24.2 18.7V20.5H29.3L28.5 25.5Z"
        fill="white"
      />
    </svg>
  );
}

export function InstagramBrandIcon({ className = 'w-10 h-10', size }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id="ig-radial-accounts"
          cx="20%"
          cy="110%"
          r="120%"
          fx="20%"
          fy="110%"
        >
          <stop offset="0%" stopColor="#FFD521" />
          <stop offset="15%" stopColor="#FFD521" />
          <stop offset="50%" stopColor="#F50000" />
          <stop offset="100%" stopColor="#B900B4" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ig-radial-accounts)" />
      <rect
        x="11"
        y="11"
        width="26"
        height="26"
        rx="7"
        fill="none"
        stroke="white"
        strokeWidth="2.8"
      />
      <circle cx="24" cy="24" r="6.5" fill="none" stroke="white" strokeWidth="2.8" />
      <circle cx="31.2" cy="16.8" r="1.8" fill="white" />
    </svg>
  );
}

export function LinkedInBrandIcon({ className = 'w-10 h-10', size }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="10" fill="#0A66C2" />
      <path
        d="M13.5 19H19.5V36H13.5V19ZM16.5 11C14.6 11 13 12.6 13 14.5C13 16.4 14.6 18 16.5 18C18.4 18 20 16.4 20 14.5C20 12.6 18.4 11 16.5 11Z"
        fill="white"
      />
      <path
        d="M23 19H28.8V21.4H28.9C29.7 19.8 31.8 18.5 34.6 18.5C40.6 18.5 41.8 22.4 41.8 27.6V36H35.8V28.2C35.8 26.3 35.8 23.9 33.2 23.9C30.6 23.9 30.2 25.9 30.2 28V36H24.2L23 19Z"
        fill="white"
      />
    </svg>
  );
}

export function TikTokBrandIcon({ className = 'w-10 h-10', size }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#000000" />
      <g transform="translate(11, 10) scale(1.1)">
        <path
          d="M15.5 0.5C16.8 2.5 18.8 4 21.5 4.3V8.2C19.3 8.1 17.2 7.3 15.5 6V16.8C15.5 20.8 12.2 24 8.2 24C4.2 24 1 20.8 1 16.8C1 12.8 4.2 9.6 8.2 9.6C8.8 9.6 9.4 9.7 10 9.9V14.1C9.4 13.8 8.8 13.7 8.2 13.7C6.5 13.7 5.1 15.1 5.1 16.8C5.1 18.5 6.5 19.9 8.2 19.9C9.9 19.9 11.4 18.5 11.4 16.8V0.5H15.5Z"
          fill="#25F4EE"
          opacity="0.85"
        />
        <path
          d="M16.5 1.5C17.8 3.5 19.8 5 22.5 5.3V9.2C20.3 9.1 18.2 8.3 16.5 7V17.8C16.5 21.8 13.2 25 9.2 25C5.2 25 2 21.8 2 17.8C2 13.8 5.2 10.6 9.2 10.6C9.8 10.6 10.4 10.7 11 10.9V15.1C10.4 14.8 9.8 14.7 9.2 14.7C7.5 14.7 6.1 16.1 6.1 17.8C6.1 19.5 7.5 20.9 9.2 20.9C10.9 20.9 12.4 19.5 12.4 17.8V1.5H16.5Z"
          fill="#FE2C55"
          opacity="0.85"
        />
        <path
          d="M16 1C17.3 3 19.3 4.5 22 4.8V8.7C19.8 8.6 17.7 7.8 16 6.5V17.3C16 21.3 12.7 24.5 8.7 24.5C4.7 24.5 1.5 21.3 1.5 17.3C1.5 13.3 4.7 10.1 8.7 10.1C9.3 10.1 9.9 10.2 10.5 10.4V14.6C9.9 14.3 9.3 14.2 8.7 14.2C7 14.2 5.6 15.6 5.6 17.3C5.6 19 7 20.4 8.7 20.4C10.4 20.4 11.9 19 11.9 17.3V1H16Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

export function WordPressBrandIcon({ className = 'w-10 h-10', size }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="24" fill="#21759B" />
      <circle cx="24" cy="24" r="20" fill="none" stroke="white" strokeWidth="2.2" />
      <path
        d="M9.8 24C9.8 27.6 11.1 30.9 13.3 33.5L20.8 13.2C14.7 14.9 9.8 18.9 9.8 24ZM32.3 22.8C32.3 20.8 31.6 19.5 31 18.4C29.9 16.7 29.9 15.3 29.9 14.2C29.9 12 31.6 10.4 34 10.4C34.2 10.4 34.3 10.4 34.5 10.4C31.5 7.7 27.5 6.2 23.2 6.2C17.5 6.2 12.6 8.7 9.5 12.8C10.3 12.8 12.3 12.8 13.7 12.8C15.6 12.8 18.4 12.2 18.4 12.2C19.1 12.2 19.3 13.2 18.6 13.4C18.6 13.4 17.3 13.7 16.1 13.8L22.2 31.8L26 20.5L23.3 13.8C22.2 13.7 21 13.4 21 13.4C20.3 13.2 20.5 12.2 21.2 12.2C21.2 12.2 24.1 12.8 25.8 12.8C27.7 12.8 30.6 12.2 30.6 12.2C31.3 12.2 31.5 13.2 30.8 13.4C30.8 13.4 29.5 13.7 28.3 13.8L32.2 25.4L33.7 20.9C34.1 19.4 34.4 18.2 34.4 17.2C34.4 15.7 33.9 14.9 33.3 14.1C32.8 13.4 32.2 12.9 32.2 12.9C31.6 12.3 32.1 11.4 32.9 11.4C33.1 11.4 35.8 11.6 37.4 11.6C37.9 11.6 38.3 11.6 38.4 11.6C38.3 11.9 38.2 12.3 38.2 12.6C38.2 13.9 38.5 15.2 38.5 16.8C38.5 18.9 37.9 20.9 37.1 23.4L31.8 36.3C35.5 33.7 38 29.2 38 24C38 21.6 37.3 19.3 36.1 17.3C34.9 19.5 33.3 21.9 32.3 22.8ZM23.8 37.8L18.4 22L14.7 33.8C17.3 36.3 20.4 37.8 23.8 37.8ZM29.2 36.4L25.3 25L28.7 35C28.9 35.5 29 36 29.2 36.4Z"
        fill="white"
      />
    </svg>
  );
}

export function YouTubeBrandIcon({ className = 'w-10 h-10', size }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#FF0000" />
      <path
        d="M38 18C37.7 15.5 35.7 13.5 33.2 13.2C29.5 12.8 24 12.8 24 12.8C24 12.8 18.5 12.8 14.8 13.2C12.3 13.5 10.3 15.5 10 18C9.6 21 9.6 24 9.6 24C9.6 24 9.6 27 10 30C10.3 32.5 12.3 34.5 14.8 34.8C18.5 35.2 24 35.2 24 35.2C24 35.2 29.5 35.2 33.2 34.8C35.7 34.5 37.7 32.5 38 30C38.4 27 38.4 24 38.4 24C38.4 24 38.4 21 38 18Z"
        fill="white"
      />
      <path d="M21 28.5L29 24L21 19.5V28.5Z" fill="#FF0000" />
    </svg>
  );
}

export function XTwitterBrandIcon({ className = 'w-10 h-10', size }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#000000" />
      <path
        d="M29.5 13H33.9L24.4 23.9L35.5 36H26.7L19.8 27.1L12 36H7.6L17.7 24.4L7 13H16L22.2 21.2L29.5 13ZM27.9 33.4H30.4L14.7 15.4H12.1L27.9 33.4Z"
        fill="white"
      />
    </svg>
  );
}

export function PinterestBrandIcon({ className = 'w-10 h-10', size }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="24" fill="#E60023" />
      <path
        d="M24 11C16.8 11 11 16.8 11 24C11 29.5 14.5 34.2 19.3 36.1C19.2 35.1 19.1 33.5 19.4 32.3C19.7 31 21.2 24.3 21.2 24.3C21.2 24.3 20.8 23.3 20.8 21.9C20.8 19.8 22 18.2 23.6 18.2C24.9 18.2 25.6 19.2 25.6 20.3C25.6 21.6 24.8 23.6 24.3 25.5C23.9 27.1 25.1 28.4 26.7 28.4C29.6 28.4 31.8 25.3 31.8 20.9C31.8 17.1 29 14.3 24.4 14.3C19.1 14.3 15.9 18.3 15.9 22.5C15.9 24.1 16.5 25.8 17.3 26.8C17.5 27 17.5 27.2 17.4 27.6C17.3 28.1 16.9 29.6 16.8 30C16.7 30.4 16.4 30.5 16 30.3C13.8 29.3 12.4 26 12.4 22.4C12.4 16.9 16.4 12 24.6 12C31.1 12 36.1 16.7 36.1 22.9C36.1 29.4 32 34.6 26.4 34.6C24.5 34.6 22.8 33.6 22.2 32.5L20.7 38.2C20.1 40.4 18.6 43.1 17.6 44.7C19.6 45.3 21.8 45.7 24 45.7C36 45.7 45.7 36 45.7 24C45.7 12 36 2.3 24 2.3V11Z"
        fill="white"
      />
    </svg>
  );
}
