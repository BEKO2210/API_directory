import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, '..', 'src', 'data', 'apis-cache.json');
const COMMUNITY_PATH = join(__dirname, '..', 'src', 'data', 'community-apis.json');
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

function mergeCommunityData(data: ReturnType<typeof parseReadme>): ReturnType<typeof parseReadme> {
  if (!existsSync(COMMUNITY_PATH)) return data;

  try {
    const community = JSON.parse(readFileSync(COMMUNITY_PATH, 'utf-8'));

    // Process removals
    if (Array.isArray(community.remove)) {
      for (const removal of community.remove) {
        for (const cat of data.categories) {
          const before = cat.apis.length;
          cat.apis = cat.apis.filter(
            (api) => api.name.toLowerCase() !== removal.name.toLowerCase(),
          );
          if (cat.apis.length < before) {
            data.meta.totalAPIs -= before - cat.apis.length;
            console.log(`  Removed "${removal.name}" (issue #${removal.source_issue})`);
          }
        }
      }
    }

    // Process updates
    if (Array.isArray(community.update)) {
      for (const update of community.update) {
        for (const cat of data.categories) {
          const api = cat.apis.find(
            (a) => a.name.toLowerCase() === update.name.toLowerCase(),
          );
          if (api) {
            for (const [key, value] of Object.entries(update.fields)) {
              (api as Record<string, unknown>)[key] = value;
            }
            console.log(`  Updated "${update.name}" (issue #${update.source_issue})`);
            break;
          }
        }
      }
    }

    // Process additions
    if (Array.isArray(community.add)) {
      for (const entry of community.add) {
        // Find or create category
        let cat = data.categories.find(
          (c) => c.name.toLowerCase() === entry.category.toLowerCase(),
        );
        if (!cat) {
          cat = { name: entry.category, slug: slugify(entry.category), apis: [] };
          data.categories.push(cat);
          data.meta.totalCategories = data.categories.length;
        }

        // Check for duplicates
        const exists = cat.apis.some(
          (a) => a.name.toLowerCase() === entry.name.toLowerCase() || a.link === entry.link,
        );
        if (exists) continue;

        cat.apis.push({
          name: entry.name,
          slug: slugify(`${entry.category}-${entry.name}`),
          description: entry.description,
          auth: entry.auth,
          https: entry.https,
          cors: entry.cors,
          link: entry.link,
        });
        data.meta.totalAPIs++;
        console.log(`  Added community API "${entry.name}" in ${entry.category} (issue #${entry.source_issue})`);
      }
    }

    // Remove empty categories
    data.categories = data.categories.filter((c) => c.apis.length > 0);
    data.meta.totalCategories = data.categories.length;
  } catch (err) {
    console.warn('Failed to merge community data:', err instanceof Error ? err.message : err);
  }

  return data;
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

    // Merge community contributions
    const merged = mergeCommunityData(data);
    console.log(`After community merge: ${merged.meta.totalAPIs} APIs across ${merged.meta.totalCategories} categories`);

    writeFileSync(CACHE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
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
