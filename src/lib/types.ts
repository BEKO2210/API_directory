export type AuthType = 'apiKey' | 'OAuth' | 'X-Mashape-Key' | 'User-Agent' | '';
export type CORSType = 'yes' | 'no' | 'unknown';

export interface API {
  slug: string;
  name: string;
  description: string;
  auth: AuthType;
  https: boolean;
  cors: CORSType;
  link: string;
  category: string;
  categorySlug: string;
}

export interface Category {
  slug: string;
  name: string;
  apis: API[];
  count: number;
  icon: string;
  description: string;
}

export interface SiteStats {
  totalAPIs: number;
  totalCategories: number;
  lastUpdated: string;
}

export interface OGImageProps {
  title: string;
  subtitle?: string;
  category?: string;
  type: 'home' | 'category' | 'api' | 'page';
}

export interface Sponsor {
  name: string;
  url: string;
  logo: string;
  tagline: string;
  tier: 'gold' | 'silver' | 'community';
}

export interface APICacheData {
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
}
