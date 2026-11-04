// Documentation routes shared by the sitemap filter and the link checker.
import { readdirSync } from 'node:fs';

export const ARCHIVE = '/docs/v1.0/';
const slugs = (dir) => readdirSync(new URL(`../src/content/${dir}/`, import.meta.url))
  .filter((name) => /\.mdx?$/.test(name))
  .map((name) => name.replace(/\.mdx?$/, ''));

export const currentSlugs = slugs('docs');
export const archivedSlugs = slugs('docs-v1.0');
export const removedSlugs = archivedSlugs.filter((s) => s !== 'index' && !currentSlugs.includes(s));
export const route = (base, slug) => (slug === 'index' ? base : `${base}${slug}/`);
