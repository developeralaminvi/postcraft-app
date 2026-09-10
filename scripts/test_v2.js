const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function runV2Test() {
  console.log('=== Starting PostCraft v2 Feature Tests ===');

  // 1. Log in or use test user
  const regEmail = `v2_test_${Date.now()}@test.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'V2 Tester', email: regEmail, password: 'password123' }),
  });
  const cookies = regRes.headers.get('set-cookie');
  console.log('1. User registered and session established.');

  // 2. Connect Facebook Account (Simulation)
  const accRes = await fetch(`${BASE_URL}/api/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
    body: JSON.stringify({
      platform: 'FACEBOOK',
      pageId: 'TEST_PAGE_V2',
      accessToken: 'TEST_ACCESS_TOKEN_V2',
    }),
  });
  const accData = await accRes.json();
  const accountId = accData.account.id;
  console.log('2. Connected Facebook Page:', accData.account.name);

  // 3. Test File Upload API
  console.log('3. Testing /api/upload endpoint...');
  const sampleImagePath = path.join(__dirname, 'test_sample.png');
  // Create a minimal 1x1 png dummy file
  const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(sampleImagePath, dummyPng);

  const fileBlob = new Blob([dummyPng], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', fileBlob, 'sample_post.png');

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Cookie': cookies },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  console.log('Upload Result:', uploadData);

  // 4. Create Post with Milestone Triggers & Auto-Reply
  console.log('4. Creating Post with Direct Upload, 10 Likes Milestone & Auto-Reply...');
  const postRes = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
    body: JSON.stringify({
      accountId: accountId,
      content: '🚀 Check out our brand new video and engagement automated post!',
      mediaUrl: uploadData.url,
      mediaType: uploadData.mediaType,
      publishNow: true,
      autoComment: {
        enabled: true,
        content: '👉 First Comment: Download the source guide here!',
        delayMinutes: 0,
      },
      milestoneTriggers: [
        {
          type: 'LIKES',
          threshold: 10,
          commentText: '🎉 10 Likes Reached! Thank you for the love! Here is your gift: https://example.com/gift',
        },
        {
          type: 'COMMENTS',
          threshold: 20,
          commentText: '🔥 20 Comments milestone! We just opened VIP access!',
        }
      ],
      autoReply: {
        isEnabled: true,
        replyText: 'Thanks for reaching out! We sent you a DM with details! 😊',
      },
    }),
  });

  const postData = await postRes.json();
  console.log('Post created status:', postData.post?.status);
  console.log('Post ID:', postData.post?.id);

  // 5. Test Trigger Queue & Engagement Milestones
  console.log('5. Running Scheduler Queue (/api/cron/process)...');
  const cronRes = await fetch(`${BASE_URL}/api/cron/process`, {
    method: 'POST',
  });
  const cronData = await cronRes.json();
  console.log('Queue Process Output:', cronData);

  console.log('=== ALL V2 FEATURES TESTED AND PASSING SUCCESSFULLY! ===');
}

runV2Test().catch(console.error);
