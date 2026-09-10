import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostCraft - Social Media Scheduler & Auto-Comment SaaS',
  description: 'Schedule social media posts and automate first comments on Facebook, Instagram, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}