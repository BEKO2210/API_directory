# API Hub

A modern, fast, and beautifully designed directory of free public APIs for developers.

Built with **Astro**, **Tailwind CSS v4**, and **TypeScript**. Deployed on **GitHub Pages** with daily automated data synchronization.

[![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **1,400+ APIs** across 50+ categories, fully searchable and filterable
- **Daily sync** — automated GitHub Actions workflow fetches the latest data from [public-apis](https://github.com/public-apis/public-apis)
- **Offline search** — powered by Pagefind with zero client-side JavaScript bundle
- **Dark mode** — system-aware with manual toggle, no flash of unstyled content
- **Responsive** — mobile-first design that looks great on every screen size
- **Accessible** — WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Fast** — Lighthouse 95+ on all four categories, zero client-side JS frameworks
- **SEO optimized** — unique meta tags, JSON-LD structured data, and OG images for every page
- **RSS feed** — stay updated with the latest API additions
- **Monetization ready** — Carbon Ads and GitHub Sponsors infrastructure built in (disabled by default)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/BEKO2210/API_directory.git
cd API_directory

# Install dependencies
pnpm install

# Fetch latest API data
pnpm run fetch

# Start development server
pnpm dev
```

## Build & Deploy

```bash
# Build for production
pnpm build

# Preview the build locally
pnpm preview
```

### GitHub Pages Deployment

1. Go to your repository Settings > Pages
2. Set Source to **GitHub Actions**
3. Push to `main` — the deploy workflow runs automatically

### Custom Domain

1. Update `site` in `astro.config.mjs` to your domain
2. Set `base` to `'/'`
3. Add a `CNAME` file in `public/` with your domain name

## Project Structure

```
├── .github/workflows/     # CI/CD: deploy, sync, lighthouse
├── public/                 # Static assets (favicon, manifest)
├── scripts/                # Data fetching scripts
├── src/
│   ├── components/         # Astro components
│   ├── data/               # API cache and mappings
│   ├── layouts/            # Page layouts
│   ├── lib/                # TypeScript utilities
│   ├── pages/              # File-based routing
│   └── styles/             # Global CSS and design tokens
└── astro.config.mjs
```

## Data Source

All API data is sourced from the [public-apis/public-apis](https://github.com/public-apis/public-apis) repository. The daily sync workflow (`sync-apis.yml`) runs at 3:00 AM UTC to fetch the latest data.

To submit a new API, contribute directly to the [public-apis repository](https://github.com/public-apis/public-apis).

## Contributing

Contributions are welcome! Please open an issue or pull request on [GitHub](https://github.com/BEKO2210/API_directory).

## License

MIT License. See [LICENSE](LICENSE) for details.

## Credits

- API data: [public-apis/public-apis](https://github.com/public-apis/public-apis)
- Framework: [Astro](https://astro.build)
- Search: [Pagefind](https://pagefind.app)
- Icons: [Lucide](https://lucide.dev)
- Fonts: [Geist](https://vercel.com/font)
