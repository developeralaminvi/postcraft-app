const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.count();
  const posts = await prisma.post.count();
  const accounts = await prisma.socialAccount.count();
  console.log('✅ Supabase PostgreSQL is 100% connected!');
  console.log('User count in Supabase:', users);
  console.log('Post count in Supabase:', posts);
  console.log('Accounts count in Supabase:', accounts);
}
check().catch(console.error);