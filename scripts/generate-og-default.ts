import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'og-default.png');

async function main(): Promise<void> {
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#09090b"/>
      <rect x="0" y="0" width="1200" height="4" fill="#6366f1"/>
      <text x="80" y="260" font-family="system-ui, sans-serif" font-size="64" font-weight="bold" fill="#fafafa">
        API Hub
      </text>
      <text x="80" y="330" font-family="system-ui, sans-serif" font-size="32" fill="#a1a1aa">
        Every Free API, One Place.
      </text>
      <text x="80" y="400" font-family="system-ui, sans-serif" font-size="24" fill="#6366f1">
        1,400+ APIs across 50+ categories
      </text>
      <text x="80" y="560" font-family="system-ui, sans-serif" font-size="20" fill="#52525b">
        beko2210.github.io/API_directory
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(OUTPUT_PATH);
  console.log(`OG image generated at ${OUTPUT_PATH}`);
}

main();
