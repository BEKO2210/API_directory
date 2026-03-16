<div align="center">

<!-- Animated Hero Banner — adapts to dark/light mode -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/hero-light.svg">
  <img alt="API Hub — Every Free API, One Place" src=".github/assets/hero-dark.svg" width="100%">
</picture>

<br><br>

<!-- Badge row -->
[![Based on public-apis](https://img.shields.io/badge/Based_on-public--apis%2Fpublic--apis-818cf8?style=for-the-badge&logo=github&logoColor=white)](https://github.com/public-apis/public-apis)
[![Live Demo](https://img.shields.io/badge/Live-Demo-22c55e?style=for-the-badge&logo=googlechrome&logoColor=white)](https://beko2210.github.io/API_directory)
[![MIT License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Submit API](https://img.shields.io/badge/Submit-New_API-3b82f6?style=for-the-badge&logo=plus&logoColor=white)](https://github.com/BEKO2210/API_directory/issues/new?template=new-api.yml)

</div>

<br>

> [!IMPORTANT]
> **This project is a community-maintained continuation of [public-apis/public-apis](https://github.com/public-apis/public-apis).**
>
> The original repository was taken over by a commercial company (APILayer) and is no longer actively maintained by its original creators. After speaking with [Matheus Felipe](https://github.com/matheusfelipeog), one of the original maintainers, who confirmed and encouraged this use, we now accept contributions directly.
>
> **[Read the full story →](FORK_NOTICE.md)**
>
> This repository and all rights are offered back to the original contributors at any time.

<br>

<!-- Animated Tech Stack — dark/light mode -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/tech-stack-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/tech-stack-light.svg">
  <img alt="Tech Stack: Astro 5, Tailwind v4, TypeScript, Pagefind, GitHub Pages, Sharp" src=".github/assets/tech-stack-dark.svg" width="100%">
</picture>

<br>

<!-- Animated Features Grid — dark/light mode -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/features-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/features-light.svg">
  <img alt="Features: 1400+ APIs, Daily Sync, Offline Search, Dark Mode, PWA Ready, SEO Optimized" src=".github/assets/features-dark.svg" width="100%">
</picture>

<br>

<!-- Animated Architecture Flow — dark/light mode -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/architecture-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset=".github/assets/architecture-light.svg">
  <img alt="Architecture: public-apis → GitHub Actions → Astro Build → Pagefind → GitHub Pages" src=".github/assets/architecture-dark.svg" width="100%">
</picture>

---

<details>
<summary><strong>&nbsp;How to Contribute</strong></summary>

<br>

There are three ways to contribute:

| Method | Description |
|:-------|:------------|
| **[Submit New API](https://github.com/BEKO2210/API_directory/issues/new?template=new-api.yml)** | Fill in our issue form — auto-processed on next build |
| **[Report Broken API](https://github.com/BEKO2210/API_directory/issues/new?template=broken-api.yml)** | Flag APIs that no longer work |
| **[Pull Request](CONTRIBUTING.md)** | Edit `community-apis.json` directly |

> [!TIP]
> Issues created via our templates are **automatically processed** by GitHub Actions. New APIs are added and broken ones are tracked — no manual review needed for straightforward submissions.

</details>

<details>
<summary><strong>&nbsp;Quick Start</strong></summary>

<br>

```bash
git clone https://github.com/BEKO2210/API_directory.git
cd API_directory
pnpm install
pnpm run fetch   # Download latest API data + merge community contributions
pnpm dev          # Start dev server at localhost:4321
```

```bash
pnpm build        # Production build (1,481 static pages)
pnpm preview      # Preview production build locally
```

</details>

<details>
<summary><strong>&nbsp;Deploy to GitHub Pages</strong></summary>

<br>

| Step | Action |
|:-----|:-------|
| **1** | Fork this repository |
| **2** | Go to **Settings** → **Pages** → Source: **GitHub Actions** |
| **3** | Push to `main` — the deploy workflow runs automatically |
| **4** | Your site is live at `https://<user>.github.io/API_directory` |

> [!TIP]
> For a custom domain, update `site` and `base` in `astro.config.mjs` and add a `CNAME` file in `public/`.

</details>

<details>
<summary><strong>&nbsp;Project Structure</strong></summary>

<br>

```
├── .github/
│   ├── workflows/             # CI/CD: deploy, daily sync + issue processing, lighthouse
│   └── ISSUE_TEMPLATE/        # Structured forms for API submissions & reports
├── public/                    # Static assets, PWA icons, manifest
├── scripts/
│   ├── fetch-apis.ts          # Fetch from public-apis + merge community data
│   └── process-issues.ts      # Auto-process GitHub issues
├── src/
│   ├── components/            # Astro components (Header, APICard, FilterBar...)
│   ├── data/
│   │   ├── apis-cache.json    # Full dataset (1,400+ APIs from public-apis + community)
│   │   ├── community-apis.json # Community contributions (add/remove/update)
│   │   └── reported-issues.json # Tracked broken API reports
│   ├── layouts/               # Base, Page, CategoryLayout
│   ├── lib/                   # TypeScript: types, utils, getApis, parseApis
│   ├── pages/                 # File-based routing (51 categories, 1,400+ API pages)
│   └── styles/                # Design tokens, global CSS
└── astro.config.mjs           # Astro + Tailwind v4 + Sitemap + Compress
```

</details>

<details>
<summary><strong>&nbsp;Daily Sync & Issue Processing</strong></summary>

<br>

The [`sync-apis.yml`](.github/workflows/sync-apis.yml) workflow runs every day at **03:00 UTC** and also triggers when new issues are opened:

1. **Processes open issues** — new API submissions, broken reports, and updates are parsed and applied
2. **Fetches the latest data** from [public-apis/public-apis](https://github.com/public-apis/public-apis)
3. **Merges community contributions** from `community-apis.json`
4. **Commits changes** and triggers a rebuild if data has changed
5. **Closes processed issues** with a status comment

> [!NOTE]
> The base data still comes from public-apis/public-apis. Community contributions are merged on top, so new APIs, removals, and updates from both sources are reflected.

</details>

<details>
<summary><strong>&nbsp;Categories</strong></summary>

<br>

<table>
<tr><td>Animals</td><td>Anime</td><td>Anti-Malware</td><td>Art & Design</td></tr>
<tr><td>Authentication</td><td>Blockchain</td><td>Books</td><td>Business</td></tr>
<tr><td>Calendar</td><td>Cloud Storage</td><td>Continuous Integration</td><td>Cryptocurrency</td></tr>
<tr><td>Currency Exchange</td><td>Data Validation</td><td>Development</td><td>Dictionaries</td></tr>
<tr><td>Documents</td><td>Email</td><td>Entertainment</td><td>Environment</td></tr>
<tr><td>Events</td><td>Finance</td><td>Food & Drink</td><td>Games & Comics</td></tr>
<tr><td>Geocoding</td><td>Government</td><td>Health</td><td>Jobs</td></tr>
<tr><td>Machine Learning</td><td>Music</td><td>News</td><td>Open Data</td></tr>
<tr><td>Open Source</td><td>Patent</td><td>Personality</td><td>Phone</td></tr>
<tr><td>Photography</td><td>Programming</td><td>Science & Math</td><td>Security</td></tr>
<tr><td>Shopping</td><td>Social</td><td>Sports & Fitness</td><td>Test Data</td></tr>
<tr><td>Text Analysis</td><td>Tracking</td><td>Transportation</td><td>URL Shorteners</td></tr>
<tr><td>Vehicle</td><td>Video</td><td>Weather</td><td><em>+ community additions</em></td></tr>
</table>

</details>

---

<div align="center">

### Community-maintained continuation of

<a href="https://github.com/public-apis/public-apis">
  <img src="https://img.shields.io/badge/public--apis%2Fpublic--apis-★_330k+-09090b?style=for-the-badge&logo=github&logoColor=white" alt="public-apis repository">
</a>

<br><br>

**Original data belongs to the [public-apis](https://github.com/public-apis/public-apis) community.**<br>
**This repo and all rights are offered to the [original contributors](FORK_NOTICE.md#credits--original-contributors) at any time.**

<br>

Want to add your API? **[Submit via issue form →](https://github.com/BEKO2210/API_directory/issues/new?template=new-api.yml)**

<br>

<sub>Built with Astro, Tailwind CSS v4, TypeScript, and Pagefind. Licensed under MIT.</sub>

</div>
