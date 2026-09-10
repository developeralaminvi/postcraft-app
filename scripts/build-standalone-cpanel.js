const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const STANDALONE_DIR = path.join(ROOT_DIR, '.next', 'standalone');
const ZIP_OUTPUT_1 = path.join(ROOT_DIR, 'postcraft-cpanel-ready.zip');
const ZIP_OUTPUT_2 = path.join(ROOT_DIR, '..', 'postcraft-cpanel-ready.zip');

console.log('[Standalone Packager] Starting full standalone preparation...');

// 1. Helper function for copying directories recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 2. Ensure .next/static is inside .next/standalone/.next/static
console.log('[Standalone Packager] Syncing .next/static...');
const staticSrc = path.join(ROOT_DIR, '.next', 'static');
const staticDest = path.join(STANDALONE_DIR, '.next', 'static');
copyDirSync(staticSrc, staticDest);

// 3. Ensure public directory is inside .next/standalone/public
console.log('[Standalone Packager] Syncing public directory...');
const publicSrc = path.join(ROOT_DIR, 'public');
const publicDest = path.join(STANDALONE_DIR, 'public');
copyDirSync(publicSrc, publicDest);

// 4. Ensure prisma folder is in standalone
console.log('[Standalone Packager] Syncing prisma schema & migrations...');
const prismaSrc = path.join(ROOT_DIR, 'prisma');
const prismaDest = path.join(STANDALONE_DIR, 'prisma');
copyDirSync(prismaSrc, prismaDest);

// 5. Ensure scripts folder is in standalone
console.log('[Standalone Packager] Syncing scripts...');
const scriptsSrc = path.join(ROOT_DIR, 'scripts');
const scriptsDest = path.join(STANDALONE_DIR, 'scripts');
copyDirSync(scriptsSrc, scriptsDest);

// 6. Ensure critical node_modules (mysql2, bcryptjs, jsonwebtoken, etc.) are in standalone/node_modules
console.log('[Standalone Packager] Ensuring all required modules are present in standalone node_modules...');
const standaloneNodeModules = path.join(STANDALONE_DIR, 'node_modules');
if (!fs.existsSync(standaloneNodeModules)) {
  fs.mkdirSync(standaloneNodeModules, { recursive: true });
}

const requiredModules = [
  'mysql2',
  'bcryptjs',
  'jsonwebtoken',
  'clsx',
  'tailwind-merge',
  'date-fns',
  'lucide-react',
  'prisma',
  '@prisma',
];

requiredModules.forEach((mod) => {
  const modSrc = path.join(ROOT_DIR, 'node_modules', mod);
  const modDest = path.join(standaloneNodeModules, mod);
  if (fs.existsSync(modSrc) && !fs.existsSync(modDest)) {
    console.log(`  -> Copying ${mod}...`);
    copyDirSync(modSrc, modDest);
  }
});

// 7. Ensure .env and installed.lock are NOT present so wizard runs fresh
const lockFile = path.join(STANDALONE_DIR, 'installed.lock');
if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
const envFile = path.join(STANDALONE_DIR, '.env');
if (fs.existsSync(envFile)) fs.unlinkSync(envFile);

// 8. Copy .env.example
fs.copyFileSync(
  path.join(ROOT_DIR, '.env.example'),
  path.join(STANDALONE_DIR, '.env.example')
);

// 9. Now compress the standalone directory into ZIP
console.log('[Standalone Packager] Compressing standalone bundle into ZIP archive...');
if (fs.existsSync(ZIP_OUTPUT_1)) fs.unlinkSync(ZIP_OUTPUT_1);
if (fs.existsSync(ZIP_OUTPUT_2)) fs.unlinkSync(ZIP_OUTPUT_2);

try {
  // Use PowerShell Compress-Archive
  const psCmd = `powershell -Command "Compress-Archive -Path '${STANDALONE_DIR}\\*' -DestinationPath '${ZIP_OUTPUT_1}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });

  // Copy to parent directory as well
  fs.copyFileSync(ZIP_OUTPUT_1, ZIP_OUTPUT_2);

  // Also overwrite the original postcraft-cpanel-installer.zip so either filename works!
  const origZip1 = path.join(ROOT_DIR, 'postcraft-cpanel-installer.zip');
  const origZip2 = path.join(ROOT_DIR, '..', 'postcraft-cpanel-installer.zip');
  fs.copyFileSync(ZIP_OUTPUT_1, origZip1);
  fs.copyFileSync(ZIP_OUTPUT_1, origZip2);

  const sizeMB = (fs.statSync(ZIP_OUTPUT_1).size / (1024 * 1024)).toFixed(2);
  console.log(`\n========================================`);
  console.log(`[SUCCESS] Standalone ZIP Generated!`);
  console.log(`File: ${ZIP_OUTPUT_1}`);
  console.log(`Size: ${sizeMB} MB`);
  console.log(`Zero "Run NPM Install" needed on cPanel!`);
  console.log(`========================================\n`);
} catch (err) {
  console.error('[Standalone Packager] Compression error:', err);
}
