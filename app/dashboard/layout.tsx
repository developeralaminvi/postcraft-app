import fs from 'fs';
import path from 'path';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isInstalled = fs.existsSync(path.join(process.cwd(), 'installed.lock'));
  if (!isInstalled) {
    redirect('/install');
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}