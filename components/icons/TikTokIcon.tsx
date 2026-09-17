import React from 'react';

interface TikTokIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  colored?: boolean;
}

export default function TikTokIcon({
  size = 20,
  className = '',
  colored = false,
  ...props
}: TikTokIconProps) {
  if (colored) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <path
          d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.894 2.894 0 0 1 2.314-4.639c.294 0 .578.04.851.118V9.371a6.333 6.333 0 0 0-1.002-.08 6.34 6.34 0 0 0-6.334 6.34 6.34 6.34 0 0 0 6.334 6.34 6.34 6.34 0 0 0 6.334-6.34V8.755a8.16 8.16 0 0 0 4.929 1.664V6.994a4.82 4.82 0 0 1-1.01-.308z"
          fill="#FE2C55"
        />
        <path
          d="M18.8 6.4a4.8 4.8 0 0 1-3.5-3.9V2h-2.8v13.7a3.5 3.5 0 0 1-4.9 3.2 3.5 3.5 0 0 1-2-4.4 3.5 3.5 0 0 1 3.5-2.2c.3 0 .6 0 .9.1V9.4a6.3 6.3 0 0 0-1-.1 6.3 6.3 0 0 0-6.3 6.3 6.3 0 0 0 6.3 6.4 6.3 0 0 0 6.3-6.4V8.8a8.2 8.2 0 0 0 4.6 1.5V7a4.8 4.8 0 0 1-1.1-.6z"
          fill="#25F4EE"
          style={{ mixBlendMode: 'screen' }}
        />
        <path
          d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.894 2.894 0 0 1 2.314-4.639c.294 0 .578.04.851.118V9.371a6.333 6.333 0 0 0-1.002-.08 6.34 6.34 0 0 0-6.334 6.34 6.34 6.34 0 0 0 6.334 6.34 6.34 6.34 0 0 0 6.334-6.34V8.755a8.16 8.16 0 0 0 4.929 1.664V6.994a4.82 4.82 0 0 1-1.01-.308z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.894 2.894 0 0 1 2.314-4.639c.294 0 .578.04.851.118V9.371a6.333 6.333 0 0 0-1.002-.08 6.34 6.34 0 0 0-6.334 6.34 6.34 6.34 0 0 0 6.334 6.34 6.34 6.34 0 0 0 6.334-6.34V8.755a8.16 8.16 0 0 0 4.929 1.664V6.994a4.82 4.82 0 0 1-1.01-.308z" />
    </svg>
  );
}
