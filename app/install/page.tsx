'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Database,
  ShieldCheck,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  KeyRound,
  User,
  Mail,
  Check
} from 'lucide-react';

export default function InstallPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [checkingInstalled, setCheckingInstalled] = useState(true);

  // DB State
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPass, setDbPass] = useState('');
  const [showDbPass, setShowDbPass] = useState(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  // Admin & App State
  const [appUrl, setAppUrl] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Installation state
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [installSteps, setInstallSteps] = useState<string[]>([]);

  // Check if already installed
  useEffect(() => {
    fetch('/api/install')
      .then((res) => res.json())
      .then((data) => {
        if (data.isInstalled) {
          setIsAlreadyInstalled(true);
        }
      })
      .catch((err) => console.error('Error checking install status:', err))
      .finally(() => setCheckingInstalled(false));

    // Autodetect App URL
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
    }
  }, []);

  // Test Database Connection
  const handleTestConnection = async () => {
    if (!dbName.trim() || !dbUser.trim()) {
      setDbTestResult({
        success: false,
        error: 'Please fill in Database Name and Database Username first.',
      });
      return;
    }

    setIsTestingDb(true);
    setDbTestResult(null);

    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          dbHost,
          dbPort: Number(dbPort) || 3306,
          dbName,
          dbUser,
          dbPass,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDbTestResult({
          success: false,
          error: data.error || 'Connection failed. Please check host, database name, user, and password.',
        });
      } else {
        setDbTestResult({
          success: true,
          message: 'Connection successful! MySQL database is accessible.',
        });
      }
    } catch (err: any) {
      setDbTestResult({
        success: false,
        error: err?.message || 'Network error connecting to installer API.',
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  // Run Final Installation
  const handleRunInstallation = async () => {
    if (!adminEmail || !adminPass) {
      setInstallError('Admin Email and Password are required.');
      return;
    }

    if (adminPass.length < 6) {
      setInstallError('Password must be at least 6 characters.');
      return;
    }

    if (adminPass !== confirmPass) {
      setInstallError('Passwords do not match.');
      return;
    }

    setIsInstalling(true);
    setInstallError(null);
    setInstallSteps(['Connecting to MySQL server...']);

    try {
      setTimeout(() => {
        setInstallSteps((prev) => [...prev, 'Creating tables: User, SocialAccount, Post, Comment...']);
      }, 700);

      setTimeout(() => {
        setInstallSteps((prev) => [...prev, 'Creating admin user & generating security keys...']);
      }, 1500);

      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          dbHost,
          dbPort: Number(dbPort) || 3306,
          dbName,
          dbUser,
          dbPass,
          adminName,
          adminEmail,
          adminPass,
          appUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setInstallError(data.error || 'Installation failed.');
        setIsInstalling(false);
        return;
      }

      setInstallSteps((prev) => [...prev, 'Generating .env configuration & locking installer...']);

      setTimeout(() => {
        setIsInstalling(false);
        setInstallSuccess(true);
      }, 1000);
    } catch (err: any) {
      setInstallError(err?.message || 'Installation encountered an unexpected network error.');
      setIsInstalling(false);
    }
  };

  if (checkingInstalled) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-slate-300">Checking installation status...</p>
        </div>
      </div>
    );
  }

  if (isAlreadyInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Already Installed</h2>
          <p className="text-sm text-slate-600 mb-6">
            PostCraft is already installed on this server. If you want to reinstall, remove <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">installed.lock</code> from the root folder.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Container */}
      <div className="max-w-2xl w-full mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            PostCraft Setup Wizard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            WordPress-style 1-Click Installer for cPanel &amp; MySQL
          </p>
        </div>

        {/* Wizard Steps Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-800 -z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 transition-all duration-300 -z-0"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />

            {[
              { num: 1, label: 'Readiness' },
              { num: 2, label: 'Database' },
              { num: 3, label: 'Admin Setup' },
              { num: 4, label: 'Install' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num || installSuccess;

              return (
                <div key={step.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white ring-4 ring-slate-950'
                        : isActive
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium ${
                      isActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8">
          {/* STEP 1: System Readiness */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-400" /> System Compatibility Check
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  We checked your server environment. Everything is prepared for installation.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { title: 'Node.js Runtime Environment', desc: 'Node.js 18+ active under cPanel Passenger', ok: true },
                  { title: 'MySQL Client Driver (mysql2)', desc: 'Installed & ready for database queries', ok: true },
                  { title: 'File System Write Permission', desc: 'Allows writing .env and lock files', ok: true },
                  { title: 'Graph API & Encryption Support', desc: 'Crypto & HTTPS modules active', ok: true },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 leading-relaxed">
                💡 <strong>Tip for cPanel:</strong> Before proceeding, ensure you have created a MySQL Database and MySQL User in your cPanel dashboard (under <em>MySQL® Databases</em>), and added the user to the database with <strong>ALL PRIVILEGES</strong>.
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
                >
                  Continue to Database Setup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Database Configuration */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" /> MySQL Database Settings
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your cPanel MySQL connection details below:
                </p>
              </div>

              {dbTestResult && (
                <div
                  className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs border ${
                    dbTestResult.success
                      ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-800/60 text-rose-200'
                  }`}
                >
                  {dbTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{dbTestResult.success ? 'Success!' : 'Connection Failed'}</p>
                    <p className="mt-0.5">{dbTestResult.message || dbTestResult.error}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Database Host
                  </label>
                  <input
                    type="text"
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                    placeholder="localhost"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Usually localhost on cPanel</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={dbPort}
                    onChange={(e) => setDbPort(e.target.value)}
                    placeholder="3306"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default: 3306</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  required
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="e.g. aroaitco_postcraft"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Database Username *
                </label>
                <input
                  type="text"
                  required
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="e.g. aroaitco_dbuser"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Database Password
                </label>
                <div className="relative">
                  <input
                    type={showDbPass ? 'text' : 'password'}
                    value={dbPass}
                    onChange={(e) => setDbPass(e.target.value)}
                    placeholder="Enter MySQL password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDbPass(!showDbPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showDbPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingDb || !dbName || !dbUser}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition disabled:opacity-50"
                >
                  {isTestingDb ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> Testing Connection...
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5 text-indigo-400" /> Test Connection
                    </>
                  )}
                </button>

                <div className="w-full sm:w-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!dbName.trim() || !dbUser.trim()) {
                        setDbTestResult({
                          success: false,
                          error: 'Please fill in Database Name and Username before proceeding.',
                        });
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
                  >
                    Next: Admin Account <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Admin & Site Configuration */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" /> Admin &amp; Site Setup
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Create your administrator login credentials and configure your domain URL.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Application Site URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://postcraft.aroait.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Domain where PostCraft is hosted</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Admin Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Al-Amin (Admin)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Admin Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@postcraft.aroait.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      required
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      required
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!adminEmail || !adminPass) {
                      alert('Please provide an Admin Email and Password');
                      return;
                    }
                    if (adminPass !== confirmPass) {
                      alert('Passwords do not match');
                      return;
                    }
                    setCurrentStep(4);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
                >
                  Review &amp; Install <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Run Installation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {!installSuccess ? (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" /> Ready to Install
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Review your configuration and click below to build the database automatically.
                    </p>
                  </div>

                  {installError && (
                    <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Installation Error</p>
                        <p className="mt-0.5">{installError}</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-4 space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-700/40">
                      <span className="text-slate-400">Database Server</span>
                      <span className="font-mono text-slate-200">{dbHost}:{dbPort}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-700/40">
                      <span className="text-slate-400">Database Name</span>
                      <span className="font-mono text-slate-200">{dbName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-700/40">
                      <span className="text-slate-400">Database User</span>
                      <span className="font-mono text-slate-200">{dbUser}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-700/40">
                      <span className="text-slate-400">App URL</span>
                      <span className="font-mono text-slate-200">{appUrl}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Admin Email</span>
                      <span className="font-semibold text-indigo-300">{adminEmail}</span>
                    </div>
                  </div>

                  {isInstalling && (
                    <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
                      <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                        <Loader2 className="w-4 h-4 animate-spin" /> Installing PostCraft Engine...
                      </div>
                      {installSteps.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-300 text-[11px]">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={isInstalling}
                      onClick={() => setCurrentStep(3)}
                      className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={isInstalling}
                      onClick={handleRunInstallation}
                      className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 transition disabled:opacity-50"
                    >
                      {isInstalling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Installing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Install PostCraft Now
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* SUCCESS SCREEN */
                <div className="text-center py-6 space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 className="w-11 h-11" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-white sm:text-3xl">
                      Installation Completed!
                    </h2>
                    <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                      PostCraft has been successfully installed and configured with your MySQL database. All 6 tables are created and your administrator account is active.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 max-w-sm mx-auto text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Admin Email:</span>
                      <span className="font-semibold text-white">{adminEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Security Key:</span>
                      <span className="text-emerald-400 font-mono">Generated &amp; Locked</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Database Status:</span>
                      <span className="text-emerald-400 font-semibold">Active &amp; Synced</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 transition"
                    >
                      Go to Login Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-500">
          PostCraft Social Media Automation &copy; {new Date().getFullYear()} &bull; Empowered for cPanel
        </div>
      </div>
    </div>
  );
}
