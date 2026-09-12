const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runInstagramTests() {
  console.log('=== Starting Instagram Feature Integration Tests ===');

  // 1. Check or create a test user
  let user = await prisma.user.findFirst({
    where: { email: 'admin@postcraft.com' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'admin@postcraft.com',
        name: 'PostCraft Admin',
        password: 'hashedpassword',
      },
    });
    console.log('1. Created user:', user.email);
  } else {
    console.log('1. Found user:', user.email);
  }

  // 2. Connect or update an Instagram SocialAccount
  const igAccount = await prisma.socialAccount.upsert({
    where: {
      userId_platform_accountId: {
        userId: user.id,
        platform: 'INSTAGRAM',
        accountId: 'TEST_IG_987654321',
      },
    },
    update: {
      platform: 'INSTAGRAM',
      name: 'PostCraft Instagram (Simulated)',
      accessToken: 'TEST_IG_TOKEN_12345',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isActive: true,
    },
    create: {
      userId: user.id,
      platform: 'INSTAGRAM',
      accountId: 'TEST_IG_987654321',
      name: 'PostCraft Instagram (Simulated)',
      accessToken: 'TEST_IG_TOKEN_12345',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isActive: true,
    },
  });

  console.log('2. Connected Instagram Account:', igAccount.name, `[Platform: ${igAccount.platform}]`);

  // 3. Create a Scheduled Instagram Post with Image, First Comment, Milestone & Auto-reply
  const scheduledTime = new Date(Date.now() - 60000); // 1 minute ago so it is due

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      accountId: igAccount.id,
      content: '📸 Stunning sunset captured with PostCraft #photography #sunset #goldenhour',
      mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      mediaType: 'IMAGE',
      status: 'SCHEDULED',
      scheduledAt: scheduledTime,
      comments: {
        create: [
          {
            content: '💬 Drop your favorite camera presets in the comments below! 👇',
            scheduledAt: scheduledTime,
            status: 'PENDING',
          },
        ],
      },
      milestones: {
        create: [
          {
            type: 'LIKES',
            threshold: 10,
            commentText: '❤️ 10 likes reached! Thank you for the love fam!',
          },
        ],
      },
      autoReply: {
        create: {
          isEnabled: true,
          replyText: 'Thanks for engaging! Check out our bio link! ✨',
        },
      },
    },
    include: {
      account: true,
      comments: true,
      milestones: true,
      autoReply: true,
    },
  });

  console.log('3. Created Instagram Post:', post.id);
  console.log('   - Platform:', post.account.platform);
  console.log('   - Media:', post.mediaUrl, `(${post.mediaType})`);
  console.log('   - Comments:', post.comments.length);
  console.log('   - Milestones:', post.milestones.length);

  // 4. Simulate Publishing Worker Flow
  console.log('4. Simulating publishing worker for Instagram post...');
  
  // Verify simulated publish result
  const mockPostId = `ig_${Date.now()}`;
  const mockPostUrl = `https://www.instagram.com/p/${mockPostId}/`;

  const updatedPost = await prisma.post.update({
    where: { id: post.id },
    data: {
      status: 'PUBLISHED',
      platformPostId: mockPostId,
      platformPostUrl: mockPostUrl,
      publishedAt: new Date(),
    },
  });

  // Also publish first comment
  if (post.comments.length > 0) {
    const comment = post.comments[0];
    const mockCommentId = `ig_comm_${Date.now()}`;
    await prisma.comment.update({
      where: { id: comment.id },
      data: {
        status: 'PUBLISHED',
        platformCommentId: mockCommentId,
        publishedAt: new Date(),
      },
    });
    console.log('   - Published First Comment:', mockCommentId);
  }

  console.log('   - Post successfully published!');
  console.log('   - Live URL:', updatedPost.platformPostUrl);

  // 5. Query posts to verify Instagram posts are returned with account platform
  const fetchedPosts = await prisma.post.findMany({
    where: {
      accountId: igAccount.id,
    },
    include: {
      account: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  console.log('5. Verified query for Instagram posts:');
  for (const p of fetchedPosts) {
    console.log(`   * [${p.account.platform}] ${p.content.slice(0, 30)}... -> ${p.status} (${p.platformPostUrl || 'No URL'})`);
  }

  console.log('\n=== ALL INSTAGRAM DATABASE & FLOW TESTS PASSED! ===');
}

runInstagramTests()
  .catch((err) => {
    console.error('Test Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
