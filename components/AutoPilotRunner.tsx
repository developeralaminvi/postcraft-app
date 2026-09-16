'use client';

import { useEffect, useRef } from 'react';

export default function AutoPilotRunner() {
  const isRunningRef = useRef(false);

  useEffect(() => {
    const runQueue = async () => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      try {
        const res = await fetch('/api/cron/process', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (
            (data.postsProcessed && data.postsProcessed > 0) ||
            (data.commentsProcessed && data.commentsProcessed > 0) ||
            (data.milestonesTriggered && data.milestonesTriggered > 0) ||
            (data.repliesSent && data.repliesSent > 0)
          ) {
            console.log('[PostCraft AutoPilot] Processed jobs:', data);
            window.dispatchEvent(new CustomEvent('postcraft:refresh', { detail: data }));
          }
        }
      } catch (err) {
        // Silent catch for background heartbeat
      } finally {
        isRunningRef.current = false;
      }
    };

    // Initial check after 2 seconds
    const initialTimer = setTimeout(runQueue, 2000);

    // Periodic heartbeat every 15 seconds
    const interval = setInterval(runQueue, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return null;
}
