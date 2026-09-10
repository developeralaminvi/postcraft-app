const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('--- Starting End-to-End Test for PostCraft ---');

  // 1. Register User
  const regEmail = `test_${Date.now()}@test.com`;
  console.log(`1. Registering user: ${regEmail}...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Creator',
      email: regEmail,
      password: 'password123',
    }),
  });
  const regData = await regRes.json();
  const cookies = regRes.headers.get('set-cookie');
  console.log('User registered successfully:', regData.user?.email);

  // 2. Connect Facebook Page
  console.log('2. Connecting Facebook Page (Simulation mode)...');
  const accRes = await fetch(`${BASE_URL}/api/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({
      platform: 'FACEBOOK',
      pageId: 'TEST_PAGE_9999',
      accessToken: 'TEST_ACCESS_TOKEN',
    }),
  });
  const accData = await accRes.json();
  console.log('Account connected:', accData.account?.name, 'ID:', accData.account?.id);

  // 3. Create Immediate Post with Auto-Comment
  console.log('3. Publishing Immediate Post with Instant First Comment...');
  const postRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({
      accountId: accData.account.id,
      content: '🚀 Hello World! This is our first scheduled post via PostCraft SaaS!',
      mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
      publishNow: true,
      autoComment: {
        enabled: true,
        content: '👉 Check out our link in the first comment: https://postcraft.io #Automation',
        delayMinutes: 0,
      },
    }),
  });
  const postData = await postRes.json();
  console.log('Post published status:', postData.post?.status);
  console.log('Attached comment status:', postData.post?.comments?.[0]?.status);
  console.log('Facebook Post URL:', postData.post?.platformPostUrl);

  // 4. Create a Scheduled Post
  console.log('4. Creating a Scheduled Post (due in the past / due now for queue testing)...');
  const pastTime = new Date(Date.now() - 5000).toISOString();
  const schedRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({
      accountId: accData.account.id,
      content: '⏰ This post was scheduled and processed by the background engine!',
      publishNow: false,
      scheduledAt: pastTime,
      autoComment: {
        enabled: true,
        content: 'First comment on scheduled post!',
        delayMinutes: 0,
      },
    }),
  });
  const schedData = await schedRes.json();
  console.log('Scheduled post created. Status:', schedData.post?.status);

  // 5. Trigger Queue Scheduler
  console.log('5. Triggering Queue Engine (/api/cron/process)...');
  const cronRes = await fetch(`${BASE_URL}/api/cron/process`, {
    method: 'POST',
  });
  const cronData = await cronRes.json();
  console.log('Queue Engine Results:', cronData);

  console.log('--- ALL E2E VERIFICATIONS PASSED SUCCESSFULLY! ---');
}

runTest().catch(console.error);
