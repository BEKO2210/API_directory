import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllAPIs } from '@lib/getApis';
import { getBaseUrl } from '@lib/utils';

export function GET(context: APIContext) {
  const apis = getAllAPIs().slice(0, 100);
  const base = getBaseUrl();

  return rss({
    title: 'API Hub',
    description: 'A curated directory of free public APIs for developers.',
    site: context.site?.toString() ?? 'https://beko2210.github.io/API_directory',
    items: apis.map((api) => ({
      title: api.name,
      description: `${api.description} — Category: ${api.category}, Auth: ${api.auth || 'None'}, HTTPS: ${api.https ? 'Yes' : 'No'}, CORS: ${api.cors}`,
      link: `${base}/api/${api.slug}`,
      pubDate: new Date(),
    })),
  });
}
