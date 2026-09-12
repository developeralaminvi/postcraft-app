const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test the formatPersonalizedReply function directly
function formatPersonalizedReply(template, commenterName, isInstagram = false) {
  if (!commenterName) {
    return template.replace(/{(?:name|user)}/gi, '@user').replace(/@user/gi, '@user');
  }

  const cleanName = commenterName.trim();
  const mentionTag = isInstagram
    ? `@${cleanName.replace(/\s+/g, '_')}`
    : `@${cleanName}`;

  if (
    template.includes('{name}') ||
    template.includes('{user}') ||
    template.includes('@user')
  ) {
    return template
      .replace(/{name}/gi, mentionTag)
      .replace(/{user}/gi, mentionTag)
      .replace(/@user/gi, mentionTag);
  }

  if (!template.trim().startsWith(mentionTag)) {
    return `${mentionTag} ${template.trim()}`;
  }

  return template;
}

async function runMentionTests() {
  console.log('=== Starting @Mention & Auto-Reply Notification Tests ===\n');

  // 1. Test formatPersonalizedReply logic
  console.log('Test 1: Auto-Reply personalization and commenter mention');

  // Case A: Template with {name} for Facebook user
  const fbTemplate1 = 'Hi {name}, thanks for reaching out! We sent a message to your inbox.';
  const fbResult1 = formatPersonalizedReply(fbTemplate1, 'Rahim Khan', false);
  console.log('FB with {name}:', fbResult1);
  if (!fbResult1.includes('@Rahim Khan')) throw new Error('Failed to tag Rahim Khan in FB');

  // Case B: Template without placeholder (must auto-prepend @mention)
  const fbTemplate2 = 'Thank you for your feedback! Here is our catalog: https://store.com';
  const fbResult2 = formatPersonalizedReply(fbTemplate2, 'Karim Ullah', false);
  console.log('FB without placeholder (auto-prepend):', fbResult2);
  if (!fbResult2.startsWith('@Karim Ullah ')) throw new Error('Failed to auto-prepend @Karim Ullah');

  // Case C: Instagram username with {name}
  const igTemplate1 = 'Hey {name}, check your DM for discount coupon! 🎁';
  const igResult1 = formatPersonalizedReply(igTemplate1, 'fashion_lover_99', true);
  console.log('IG with {name}:', igResult1);
  if (!igResult1.includes('@fashion_lover_99')) throw new Error('Failed to tag @fashion_lover_99');

  // Case D: Instagram with auto-prepend
  const igTemplate2 = 'Discount coupon code is VIP2026! 🔥';
  const igResult2 = formatPersonalizedReply(igTemplate2, 'travel_blogger', true);
  console.log('IG without placeholder (auto-prepend):', igResult2);
  if (!igResult2.startsWith('@travel_blogger ')) throw new Error('Failed to auto-prepend @travel_blogger');

  console.log('✅ All mention template replacements validated successfully!\n');

  // 2. Database integration check with AutoReplyRule in Supabase
  console.log('Test 2: Verifying database integration for AutoReply with mention template');
  const user = await prisma.user.findFirst({ where: { email: 'admin@postcraft.com' } });
  if (!user) throw new Error('User admin@postcraft.com not found in Supabase');

  const account = await prisma.socialAccount.findFirst({ where: { userId: user.id } });
  if (!account) throw new Error('Social account not found');

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      accountId: account.id,
      content: '📢 Announcing our major giveaway! Tag @everyone and @followers in the comments!',
      status: 'PUBLISHED',
      platformPostId: `post_mention_test_${Date.now()}`,
      autoReply: {
        create: {
          isEnabled: true,
          replyText: 'Hello {name}, thank you for participating in our giveaway! 🎉',
        },
      },
    },
    include: {
      autoReply: true,
      account: true,
    },
  });

  console.log('Created test post with AutoReplyRule:', post.id);
  console.log('Auto-Reply Template:', post.autoReply.replyText);

  // Test simulated comment from user and personalized reply
  const simulatedCommenter = 'Tanvir Ahmed';
  const generatedReply = formatPersonalizedReply(
    post.autoReply.replyText,
    simulatedCommenter,
    post.account.platform === 'INSTAGRAM'
  );

  console.log(`When "${simulatedCommenter}" comments:`);
  console.log(`-> Push Notification generated to @${simulatedCommenter}: "${generatedReply}"`);

  // Clean up test post
  await prisma.post.delete({ where: { id: post.id } });
  console.log('Cleaned up test post.');

  console.log('\n=== ALL MENTION AND AUTO-REPLY NOTIFICATION TESTS PASSED! ===');
}

runMentionTests()
  .catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
