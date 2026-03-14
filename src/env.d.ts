/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL: string;
  readonly PLAUSIBLE_DOMAIN: string;
  readonly PLAUSIBLE_SRC: string;
  readonly ENABLE_ADS: string;
  readonly CARBON_SERVE: string;
  readonly CARBON_PLACEMENT: string;
  readonly ENABLE_SPONSORS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
