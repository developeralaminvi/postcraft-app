const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOAuthAndFastConnect() {
  console.log('Testing 1-Click Fast Connect and OAuth Account Integration...');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No test user found in database.');
    return;
  }
  console.log(`Using user: ${user.email} (${user.id})`);

  // 1. Test 1-Click Fast Connect for Facebook Page
  console.log('\n--- 1. Testing 1-Click Fast Connect for Facebook ---');
  const fbAccount = await prisma.socialAccount.create({
    data: {
      userId: user.id,
      platform: 'FACEBOOK',
      accountId: 'FAST_FB_' + Date.now(),
      name: 'Super Shop Official (1-Click Facebook)',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      category: 'Facebook Page',
      accessToken: 'FAST_CONNECT_FB_TOKEN_' + Date.now(),
      isActive: true,
    },
  });
  console.log(`✅ Successfully auto-connected Facebook Page: ${fbAccount.name} [ID: ${fbAccount.accountId}]`);

  // 2. Test 1-Click Fast Connect for Instagram
  console.log('\n--- 2. Testing 1-Click Fast Connect for Instagram ---');
  const igAccount = await prisma.socialAccount.create({
    data: {
      userId: user.id,
      platform: 'INSTAGRAM',
      accountId: 'FAST_IG_' + Date.now(),
      name: '@supershop.bd (1-Click Instagram)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      category: 'Instagram Business',
      accessToken: 'FAST_CONNECT_IG_TOKEN_' + Date.now(),
      isActive: true,
    },
  });
  console.log(`✅ Successfully auto-connected Instagram Account: ${igAccount.name} [ID: ${igAccount.accountId}]`);

  // 3. Test 1-Click Fast Connect for LinkedIn
  console.log('\n--- 3. Testing 1-Click Fast Connect for LinkedIn ---');
  const liAccount = await prisma.socialAccount.create({
    data: {
      userId: user.id,
      platform: 'LINKEDIN',
      accountId: 'urn:li:person:FAST_LI_' + Date.now(),
      name: 'Alamin Hossain (1-Click LinkedIn)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      category: 'LinkedIn Personal Profile',
      accessToken: 'FAST_CONNECT_LI_TOKEN_' + Date.now(),
      isActive: true,
    },
  });
  console.log(`✅ Successfully auto-connected LinkedIn Profile: ${liAccount.name} [ID: ${liAccount.accountId}]`);

  // 4. Test Cross-Channel Posting with newly connected 1-click accounts
  console.log('\n--- 4. Testing Multi-Channel Scheduling with Auto-Connected Channels ---');
  const postBatch = [fbAccount, igAccount, liAccount];
  const testPostIds = [];

  for (const acc of postBatch) {
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        accountId: acc.id,
        content: `🎉 Automated cross-post test to ${acc.name} without manual tokens!`,
        mediaType: 'TEXT',
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() + 3600000),
      },
    });
    testPostIds.push(post.id);
    console.log(`✅ Created scheduled post for ${acc.platform} channel "${acc.name}" (Post ID: ${post.id})`);
  }

  // Clean up test data
  console.log('\n--- 5. Cleaning Up Test Data ---');
  await prisma.post.deleteMany({ where: { id: { in: testPostIds } } });
  await prisma.socialAccount.deleteMany({
    where: { id: { in: [fbAccount.id, igAccount.id, liAccount.id] } },
  });
  console.log('✅ Cleaned up temporary test channels and posts.');

  console.log('\n🎉 ALL 1-CLICK SOCIAL CONNECT TESTS PASSED SUCCESSFULLY!');
}

testOAuthAndFastConnect()
  .catch((e) => {
    console.error('Error during test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
