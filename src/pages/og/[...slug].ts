import type { APIContext, GetStaticPaths } from 'astro';
import { getAllAPIs, getAllCategories } from '@lib/getApis';

export const getStaticPaths: GetStaticPaths = () => {
  const apis = getAllAPIs();
  const categories = getAllCategories();

  const paths = [
    { params: { slug: 'home' }, props: { title: 'API Hub', subtitle: 'Every Free API, One Place.' } },
    ...categories.map((cat) => ({
      params: { slug: `category/${cat.slug}` },
      props: { title: cat.name, subtitle: `${cat.count} APIs` },
    })),
    ...apis.map((api) => ({
      params: { slug: `api/${api.slug}` },
      props: { title: api.name, subtitle: api.category },
    })),
  ];

  return paths;
};

export async function GET({ props }: APIContext) {
  const { title, subtitle } = props as { title: string; subtitle: string };

  // Generate a simple SVG-based OG image
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#09090b"/>
      <rect x="0" y="0" width="1200" height="4" fill="#6366f1"/>
      <text x="80" y="280" font-family="system-ui, sans-serif" font-size="56" font-weight="bold" fill="#fafafa">
        ${escapeXml(title)}
      </text>
      <text x="80" y="340" font-family="system-ui, sans-serif" font-size="28" fill="#a1a1aa">
        ${escapeXml(subtitle)}
      </text>
      <text x="80" y="560" font-family="system-ui, sans-serif" font-size="22" fill="#52525b">
        API Hub — Every Free API, One Place
      </text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
