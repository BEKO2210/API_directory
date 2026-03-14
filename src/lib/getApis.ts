import type { API, Category, SiteStats, AuthType, CORSType } from './types';
import { CATEGORY_ICONS } from '../data/category-icons';
import cacheData from '../data/apis-cache.json';

const data = cacheData as {
  meta: SiteStats;
  categories: Array<{
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
  }>;
};

function normalizeAuth(auth: string): AuthType {
  const lower = auth.toLowerCase();
  if (lower === 'apikey' || lower === 'api key') return 'apiKey';
  if (lower === 'oauth') return 'OAuth';
  if (lower === 'x-mashape-key') return 'X-Mashape-Key';
  if (lower === 'user-agent') return 'User-Agent';
  if (lower === '' || lower === 'no') return '';
  return '';
}

function normalizeCors(cors: string): CORSType {
  const lower = cors.toLowerCase();
  if (lower === 'yes') return 'yes';
  if (lower === 'no') return 'no';
  return 'unknown';
}

function getIconForCategory(slug: string): string {
  return CATEGORY_ICONS[slug] ?? CATEGORY_ICONS['default'] ?? 'Zap';
}

function generateCategoryDescription(name: string, count: number): string {
  return `Browse ${count} free ${name} APIs. Find the perfect API for your next project.`;
}

export function getAllAPIs(): API[] {
  return data.categories.flatMap((cat) =>
    cat.apis.map((api) => ({
      slug: api.slug,
      name: api.name,
      description: api.description,
      auth: normalizeAuth(api.auth),
      https: api.https,
      cors: normalizeCors(api.cors),
      link: api.link,
      category: cat.name,
      categorySlug: cat.slug,
    })),
  );
}

export function getAllCategories(): Category[] {
  return data.categories.map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    count: cat.apis.length,
    icon: getIconForCategory(cat.slug),
    description: generateCategoryDescription(cat.name, cat.apis.length),
    apis: cat.apis.map((api) => ({
      slug: api.slug,
      name: api.name,
      description: api.description,
      auth: normalizeAuth(api.auth),
      https: api.https,
      cors: normalizeCors(api.cors),
      link: api.link,
      category: cat.name,
      categorySlug: cat.slug,
    })),
  }));
}

export function getAPIBySlug(slug: string): API | undefined {
  return getAllAPIs().find((api) => api.slug === slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getAllCategories().find((cat) => cat.slug === slug);
}

export function getAPIsInCategory(categorySlug: string): API[] {
  const category = getCategoryBySlug(categorySlug);
  return category?.apis ?? [];
}

export function getSiteStats(): SiteStats {
  return data.meta;
}

export function getRelatedAPIs(api: API, limit = 3): API[] {
  return getAllAPIs()
    .filter((a) => a.categorySlug === api.categorySlug && a.slug !== api.slug)
    .slice(0, limit);
}
