// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: process.env.SITE_URL || 'https://kinex-agent.com',
  base: '/',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap(), mdx()],
  markdown: {
    shikiConfig: {
      themes: { light: 'min-light', dark: 'min-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
