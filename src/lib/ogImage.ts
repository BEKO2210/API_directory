import type { OGImageProps } from './types';

export function generateOGImageSVG(props: OGImageProps): string {
  const { title, subtitle, category, type } = props;

  const accentColor = '#6366f1';
  const bgColor = '#09090b';
  const textColor = '#fafafa';
  const mutedColor = '#a1a1aa';
  const dimColor = '#52525b';

  const typeLabel =
    type === 'home'
      ? 'API Hub'
      : type === 'category'
        ? `${category ?? 'Category'}`
        : type === 'api'
          ? `${category ?? 'API'}`
          : 'API Hub';

  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="${bgColor}"/>
      <rect x="0" y="0" width="1200" height="4" fill="${accentColor}"/>
      <text x="80" y="100" font-family="system-ui, sans-serif" font-size="18" fill="${accentColor}" font-weight="600">
        ${escapeXml(typeLabel)}
      </text>
      <text x="80" y="280" font-family="system-ui, sans-serif" font-size="56" font-weight="bold" fill="${textColor}">
        ${escapeXml(truncateText(title, 40))}
      </text>
      ${
        subtitle
          ? `<text x="80" y="340" font-family="system-ui, sans-serif" font-size="28" fill="${mutedColor}">
          ${escapeXml(truncateText(subtitle, 60))}
        </text>`
          : ''
      }
      <text x="80" y="560" font-family="system-ui, sans-serif" font-size="22" fill="${dimColor}">
        API Hub — Every Free API, One Place
      </text>
    </svg>
  `;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
