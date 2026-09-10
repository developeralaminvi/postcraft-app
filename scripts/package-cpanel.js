const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const STAGING_DIR = path.join(ROOT_DIR, 'dist_cpanel');
const ZIP_OUTPUT_1 = path.join(ROOT_DIR, 'postcraft-cpanel-installer.zip');
const ZIP_OUTPUT_2 = path.join(ROOT_DIR, '..', 'postcraft-cpanel-installer.zip');

console.log('[Packaging] Starting cPanel installer bundle creation...');

// 1. Clean previous staging
if (fs.existsSync(STAGING_DIR)) {
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
}
fs.mkdirSync(STAGING_DIR, { recursive: true });

// Helper to copy recursively while skipping unwanted files/dirs
function copyRecursive(src, dest, filterFn) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (filterFn && !filterFn(src, true)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursive(path.join(src, child), path.join(dest, child), filterFn);
    });
  } else {
    if (filterFn && !filterFn(src, false)) return;
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 2. Copy .next (skip cache)
console.log('[Packaging] Copying compiled .next build (excluding compiler cache)...');
copyRecursive(
  path.join(ROOT_DIR, '.next'),
  path.join(STAGING_DIR, '.next'),
  (filePath, isDir) => {
    // Exclude .next/cache directory
    return !filePath.includes(path.join('.next', 'cache'));
  }
);

// 3. Copy source folders
const foldersToCopy = ['app', 'components', 'lib', 'prisma', 'scripts'];
foldersToCopy.forEach((folder) => {
  console.log(`[Packaging] Copying ${folder}...`);
  copyRecursive(path.join(ROOT_DIR, folder), path.join(STAGING_DIR, folder));
});

// 4. Copy public (skip test uploads)
console.log('[Packaging] Copying public assets...');
copyRecursive(
  path.join(ROOT_DIR, 'public'),
  path.join(STAGING_DIR, 'public'),
  (filePath, isDir) => {
    // Only keep .gitkeep inside uploads
    if (filePath.includes(path.join('public', 'uploads'))) {
      if (isDir) return true;
      return path.basename(filePath) === '.gitkeep';
    }
    return true;
  }
);
// Ensure uploads folder exists with .gitkeep
const uploadsDest = path.join(STAGING_DIR, 'public', 'uploads');
if (!fs.existsSync(uploadsDest)) fs.mkdirSync(uploadsDest, { recursive: true });
fs.writeFileSync(path.join(uploadsDest, '.gitkeep'), '', 'utf8');

// 5. Copy root config files
const rootFiles = [
  'package.json',
  'server.js',
  'next.config.mjs',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.js',
  '.env.example',
  'README.md',
];

rootFiles.forEach((file) => {
  const src = path.join(ROOT_DIR, file);
  if (fs.existsSync(src)) {
    console.log(`[Packaging] Copying ${file}...`);
    fs.copyFileSync(src, path.join(STAGING_DIR, file));
  }
});

// 6. Compress with PowerShell Compress-Archive
console.log('[Packaging] Compressing files into ZIP archive...');
if (fs.existsSync(ZIP_OUTPUT_1)) fs.unlinkSync(ZIP_OUTPUT_1);
if (fs.existsSync(ZIP_OUTPUT_2)) fs.unlinkSync(ZIP_OUTPUT_2);

try {
  const psCmd = `powershell -Command "Compress-Archive -Path '${STAGING_DIR}\\*' -DestinationPath '${ZIP_OUTPUT_1}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });
  console.log(`[Packaging] Successfully generated ${ZIP_OUTPUT_1}`);

  // Also copy to parent scratch folder for easy access
  fs.copyFileSync(ZIP_OUTPUT_1, ZIP_OUTPUT_2);
  console.log(`[Packaging] Copied to parent: ${ZIP_OUTPUT_2}`);

  const sizeMB = (fs.statSync(ZIP_OUTPUT_1).size / (1024 * 1024)).toFixed(2);
  console.log(`[Packaging] Final ZIP Size: ${sizeMB} MB`);
} catch (err) {
  console.error('[Packaging] Error compressing archive:', err);
} finally {
  // Clean staging
  console.log('[Packaging] Cleaning temporary staging directory...');
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
}

console.log('[Packaging] Done! Ready for cPanel deployment.');
