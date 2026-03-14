import { slugify } from './utils';

interface RawAPI {
  name: string;
  link: string;
  description: string;
  auth: string;
  https: boolean;
  cors: string;
}

interface RawCategory {
  name: string;
  slug: string;
  apis: Array<{
    name: string;
    slug: string;
    description: string;
    auth: string;
    https: boolean;
    cors: string;
    link: string;
  }>;
}

interface ParsedData {
  meta: {
    totalAPIs: number;
    totalCategories: number;
    lastUpdated: string;
  };
  categories: RawCategory[];
}

function parseTableRow(row: string): RawAPI | null {
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

export function parseReadme(markdown: string): ParsedData {
  const sections = markdown.split(/^###\s+/m);
  const categories: RawCategory[] = [];
  let totalAPIs = 0;

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const categoryName = lines[0]?.trim();
    if (!categoryName) continue;

    // Skip non-category sections
    if (categoryName.toLowerCase() === 'index' || categoryName.includes('[')) continue;

    const tableLines = lines.filter((line) => line.startsWith('|') && !line.startsWith('| API') && !line.match(/^\|\s*-/));

    const apis: RawCategory['apis'] = [];
    for (const line of tableLines) {
      const parsed = parseTableRow(line);
      if (parsed) {
        const categorySlug = slugify(categoryName);
        apis.push({
          name: parsed.name,
          slug: slugify(`${categoryName}-${parsed.name}`),
          description: parsed.description,
          auth: parsed.auth,
          https: parsed.https,
          cors: parsed.cors,
          link: parsed.link,
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
