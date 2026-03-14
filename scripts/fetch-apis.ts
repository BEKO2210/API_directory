import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, '..', 'src', 'data', 'apis-cache.json');
const README_URL = 'https://raw.githubusercontent.com/public-apis/public-apis/master/README.md';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface RawAPI {
  name: string;
  slug: string;
  description: string;
  auth: string;
  https: boolean;
  cors: string;
  link: string;
}

interface RawCategory {
  name: string;
  slug: string;
  apis: RawAPI[];
}

function parseTableRow(row: string): Omit<RawAPI, 'slug'> | null {
  const match = row.match(
    /\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*(Yes|No)\s*\|\s*(Yes|No|Unknown)/i,
  );
  if (!match) return null;

  const [, name, link, description, auth, https, cors] = match;
  if (!name || !link) return null;

  return {
    name: name.trim(),
    link: link.trim(),
    description: (description ?? '').trim(),
    auth: (auth ?? '').trim().replace(/`/g, ''),
    https: https?.toLowerCase() === 'yes',
    cors: (cors ?? 'unknown').toLowerCase(),
  };
}

function parseReadme(markdown: string): { meta: { totalAPIs: number; totalCategories: number; lastUpdated: string }; categories: RawCategory[] } {
  const sections = markdown.split(/^###\s+/m);
  const categories: RawCategory[] = [];
  let totalAPIs = 0;

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const categoryName = lines[0]?.trim();
    if (!categoryName) continue;
    if (categoryName.toLowerCase() === 'index' || categoryName.includes('[')) continue;

    const tableLines = lines.filter(
      (line) => line.startsWith('|') && !line.startsWith('| API') && !line.match(/^\|\s*-/),
    );

    const apis: RawAPI[] = [];
    for (const line of tableLines) {
      const parsed = parseTableRow(line);
      if (parsed) {
        apis.push({
          ...parsed,
          slug: slugify(`${categoryName}-${parsed.name}`),
        });
      }
    }

    if (apis.length > 0) {
      categories.push({
        name: categoryName,
        slug: slugify(categoryName),
        apis,
      });
      totalAPIs += apis.length;
    }
  }

  return {
    meta: {
      totalAPIs,
      totalCategories: categories.length,
      lastUpdated: new Date().toISOString(),
    },
    categories,
  };
}

async function main(): Promise<void> {
  console.log('Fetching API data from public-apis repository...');

  try {
    const response = await fetch(README_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const markdown = await response.text();
    console.log(`Fetched README: ${(markdown.length / 1024).toFixed(1)} KB`);

    const data = parseReadme(markdown);
    console.log(`Parsed ${data.meta.totalAPIs} APIs across ${data.meta.totalCategories} categories`);

    writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Cache written to ${CACHE_PATH}`);
  } catch (error) {
    console.warn('Failed to fetch API data:', error instanceof Error ? error.message : error);

    if (existsSync(CACHE_PATH)) {
      console.log('Using existing cache file.');
    } else {
      console.log('No cache exists. Writing minimal fallback...');
      const fallback = {
        meta: { totalAPIs: 0, totalCategories: 0, lastUpdated: new Date().toISOString() },
        categories: [],
      };
      writeFileSync(CACHE_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
    }
  }
}

main();
