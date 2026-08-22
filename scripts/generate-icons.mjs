/**
 * generate-icons.mjs
 * ------------------
 * Render website/icons/icon.svg menjadi favicon.png (64x64).
 * Dipakai sekali setiap kali icon.svg diubah.
 *
 * Jalankan: npm run icons
 */

import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '..', 'website', 'icons');
const svgPath = path.join(iconsDir, 'icon.svg');

async function main() {
  const svgBuffer = await readFile(svgPath);

  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(iconsDir, 'favicon.png'));
  console.log('✔ website/icons/favicon.png (64x64) dibuat');

  console.log('Selesai.');
}

main().catch((err) => {
  console.error('Gagal generate icon:', err);
  process.exit(1);
});
