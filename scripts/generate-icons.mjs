/**
 * Sinh icon PWA: public/icons/icon-192.png và icon-512.png
 * Chạy: node scripts/generate-icons.mjs
 * Yêu cầu: pnpm add -D sharp
 */

import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

// SVG gốc — chỉnh màu/chữ tuỳ ý
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#4f46e5"/>
  <text
    x="256" y="355"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="300"
    font-weight="bold"
    fill="white"
  >Y</text>
</svg>
`.trim();

const buf = Buffer.from(svg);

await sharp(buf).resize(192, 192).png().toFile("public/icons/icon-192.png");
console.log("✓ public/icons/icon-192.png");

await sharp(buf).resize(512, 512).png().toFile("public/icons/icon-512.png");
console.log("✓ public/icons/icon-512.png");
