import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const logoDirectory = join(projectRoot, 'public', 'assets', 'img', 'logo');
const splashDirectory = join(projectRoot, 'public', 'assets', 'img', 'splash');
const faviconSvg = await readFile(join(logoDirectory, 'sayaramatch-favicon.svg'));

await mkdir(splashDirectory, { recursive: true });

await sharp(faviconSvg).resize(32, 32).png({ compressionLevel: 9 }).toFile(join(logoDirectory, 'favicon.png'));
await sharp(faviconSvg).resize(180, 180).png({ compressionLevel: 9 }).toFile(join(logoDirectory, 'apple-touch-icon.png'));
await sharp(faviconSvg).resize(192, 192).png({ compressionLevel: 9 }).toFile(join(logoDirectory, 'icon-192.png'));
await sharp(faviconSvg).resize(512, 512).png({ compressionLevel: 9 }).toFile(join(logoDirectory, 'icon-512.png'));

const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(
  icoSizes.map((size) => sharp(faviconSvg).resize(size, size).png({ compressionLevel: 9 }).toBuffer()),
);
const icoHeader = Buffer.alloc(6 + icoImages.length * 16);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(icoImages.length, 4);
let icoOffset = icoHeader.length;
icoImages.forEach((image, index) => {
  const entry = 6 + index * 16;
  icoHeader.writeUInt8(icoSizes[index], entry);
  icoHeader.writeUInt8(icoSizes[index], entry + 1);
  icoHeader.writeUInt8(0, entry + 2);
  icoHeader.writeUInt8(0, entry + 3);
  icoHeader.writeUInt16LE(1, entry + 4);
  icoHeader.writeUInt16LE(32, entry + 6);
  icoHeader.writeUInt32LE(image.length, entry + 8);
  icoHeader.writeUInt32LE(icoOffset, entry + 12);
  icoOffset += image.length;
});
await writeFile(join(projectRoot, 'public', 'favicon.ico'), Buffer.concat([icoHeader, ...icoImages]));

const maskableIcon = (size) => Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="bg" x1="10" y1="4" x2="120" y2="128" gradientUnits="userSpaceOnUse"><stop stop-color="#17243d"/><stop offset="1" stop-color="#080d18"/></linearGradient>
      <linearGradient id="coral" x1="24" y1="30" x2="77" y2="82" gradientUnits="userSpaceOnUse"><stop stop-color="#ff5261"/><stop offset="1" stop-color="#f51e30"/></linearGradient>
    </defs>
    <rect width="128" height="128" fill="url(#bg)"/>
    <g transform="translate(13 13) scale(.8)">
      <path d="M103 29H62C38 29 22 42 22 58c0 15 13 25 32 25h12" fill="none" stroke="url(#coral)" stroke-width="18" stroke-linecap="round"/>
      <path d="M25 99h41c24 0 40-13 40-29 0-15-13-25-32-25H62" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round"/>
    </g>
  </svg>`);

await sharp(maskableIcon(192)).png({ compressionLevel: 9 }).toFile(join(logoDirectory, 'icon-maskable-192.png'));
await sharp(maskableIcon(512)).png({ compressionLevel: 9 }).toFile(join(logoDirectory, 'icon-maskable-512.png'));

const splashSizes = [
  [750, 1334],
  [828, 1792],
  [1125, 2436],
  [1170, 2532],
  [1179, 2556],
  [1290, 2796],
  [1668, 2388],
  [2048, 2732],
];

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

for (const [width, height] of splashSizes) {
  const unit = Math.min(width, height);
  const iconSize = Math.round(unit * 0.25);
  const iconX = Math.round((width - iconSize) / 2);
  const iconY = Math.round(height * 0.31);
  const brandY = iconY + iconSize + Math.round(unit * 0.105);
  const taglineY = brandY + Math.round(unit * 0.07);
  const splash = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <radialGradient id="glow" cx="50%" cy="38%" r="55%"><stop stop-color="#263653"/><stop offset="1" stop-color="#080d18"/></radialGradient>
        <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="${Math.round(unit * .018)}" stdDeviation="${Math.round(unit * .025)}" flood-color="#000" flood-opacity=".32"/></filter>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#glow)"/>
      <image href="data:image/svg+xml;base64,${faviconSvg.toString('base64')}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" filter="url(#shadow)"/>
      <text x="50%" y="${brandY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(unit * .075)}" font-weight="700" letter-spacing="${Math.round(unit * -.002)}" fill="#fff">${escapeXml('Sayara')}<tspan dx="${Math.round(unit * .012)}" fill="#ff4050">${escapeXml('Match')}</tspan></text>
      <text x="50%" y="${taglineY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(unit * .025)}" font-weight="600" letter-spacing="${Math.round(unit * .004)}" fill="#aeb8ca">THE RIGHT CAR · THE RIGHT MATCH</text>
      <rect x="${Math.round(width * .44)}" y="${Math.round(height * .88)}" width="${Math.round(width * .12)}" height="${Math.max(4, Math.round(unit * .006))}" rx="${Math.max(2, Math.round(unit * .003))}" fill="#f51e30"/>
    </svg>`);

  await sharp(splash).png({ compressionLevel: 9 }).toFile(join(splashDirectory, `apple-splash-${width}x${height}.png`));
}

console.log(`Generated favicon, install icons, maskable icons, and ${splashSizes.length} launch screens.`);
