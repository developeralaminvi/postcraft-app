async function checkQueue() {
  try {
    const res = await fetch('http://localhost:3000/api/cron/process', {
      method: 'POST'
    });
    if (res.ok) {
      const data = await res.json();
      const hasAction =
        (data.postsProcessed && data.postsProcessed > 0) ||
        (data.commentsProcessed && data.commentsProcessed > 0) ||
        (data.milestonesTriggered && data.milestonesTriggered > 0) ||
        (data.repliesSent && data.repliesSent > 0);

      if (hasAction) {
        console.log(`[Worker ${new Date().toLocaleTimeString()}] Auto Activity:`, {
          posts: data.postsProcessed,
          comments: data.commentsProcessed,
          milestones: data.milestonesTriggered,
          replies: data.repliesSent,
        });
      }
    }
  } catch (err) {
    // Server booting
  }
}

console.log('[PostCraft Auto-Pilot Worker] Running in background. Checking queue every 10s...');
setInterval(checkQueue, 10000);
checkQueue();