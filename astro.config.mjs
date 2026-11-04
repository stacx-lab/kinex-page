// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { ARCHIVE, removedSlugs, route } from './scripts/doc-trees.mjs';

// Archived docs and moved-page stubs stay out of the sitemap.
const stubs = new Set(removedSlugs.map((slug) => route('/docs/', slug)));

export default defineConfig({
  site: process.env.SITE_URL || 'https://kinex-agent.com',
  base: '/',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !path.startsWith(ARCHIVE) && !stubs.has(path);
      },
    }),
    mdx(),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'min-light', dark: 'min-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
