// Verify internal links, media, and anchors against the complete published site.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARCHIVE, archivedSlugs, currentSlugs, removedSlugs, route } from './doc-trees.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const origin = new URL(process.env.SITE_URL || 'https://kinex-agent.com').origin;
const htmlFiles = [];
const cssFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== 'pagefind') walk(p); }
    else if (f.endsWith('.html')) htmlFiles.push(p);
    else if (f.endsWith('.css')) cssFiles.push(p);
  }
})(dist);

const idsCache = new Map();
const ids = (file) => {
  if (!idsCache.has(file)) idsCache.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(file);
};
const target = (path) => {
  const p = join(dist, decodeURIComponent(path));
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html');
  return null;
};

let bad = 0;
const fail = (message) => { console.error(`✗ ${message}`); bad++; };
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const pageUrl = new URL('/' + relative(dist, file).replace(/index\.html$/, ''), origin);
  for (const [, ref] of html.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)) {
    const resolved = new URL(ref.replaceAll('&amp;', '&'), pageUrl);
    if (resolved.origin !== origin) continue;
    const t = target(resolved.pathname);
    if (!t) { fail(`${relative(dist, file)}: ${ref}`); continue; }
    if (resolved.hash && t.endsWith('.html') && !ids(t).has(decodeURIComponent(resolved.hash.slice(1)))) {
      fail(`${relative(dist, file)}: ${ref} (missing anchor)`);
    }
  }
}

// Stylesheets can hide broken font/image dependencies even when HTML links work.
const stylesheets = cssFiles.map((file) => ({ file, css: readFileSync(file, 'utf8') }));
for (const file of htmlFiles) {
  for (const [, css] of readFileSync(file, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) stylesheets.push({ file, css });
}
for (const { file, css } of stylesheets) {
  const pageUrl = new URL('/' + relative(dist, file), origin);
  for (const [, ref] of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    const resolved = new URL(ref, pageUrl);
    if (resolved.origin === origin && !target(resolved.pathname)) fail(`${relative(dist, file)}: ${ref}`);
  }
}

// Current documentation must be reachable, canonical and in the sitemap.
const sitemap = readFileSync(join(dist, 'sitemap-0.xml'), 'utf8');
const page = (route) => {
  const file = target(route);
  if (!file) { fail(`Missing route: ${route}`); return null; }
  return readFileSync(file, 'utf8');
};
const listed = (route) => sitemap.includes(`<loc>${origin}${route}</loc>`);
const current = new Set(['/', '/docs/', '/docs/all/', ...currentSlugs.map((s) => route('/docs/', s))]);
for (const r of current) {
  const html = page(r);
  if (!html) continue;
  if (!html.includes(`rel="canonical" href="${origin}${r}"`)) fail(`Incorrect canonical: ${r}`);
  if (!listed(r)) fail(`Missing sitemap entry: ${r}`);
}

// Archived documentation is self-canonical, unindexed, unsearchable and self-contained.
const archived = new Set([`${ARCHIVE}all/`, ...archivedSlugs.map((s) => route(ARCHIVE, s))]);
for (const r of archived) {
  const html = page(r);
  if (!html) continue;
  if (!html.includes(`rel="canonical" href="${origin}${r}"`)) fail(`Incorrect canonical: ${r}`);
  if (!html.includes('name="robots" content="noindex"')) fail(`Archived page is indexable: ${r}`);
  if (html.includes('data-pagefind-body')) fail(`Archived page is searchable: ${r}`);
  if (listed(r)) fail(`Archived page in sitemap: ${r}`);
  const article = html.match(/<article[\s\S]*<\/article>/)?.[0] ?? '';
  for (const [, ref] of article.matchAll(/\shref="([^"]+)"/g)) {
    const resolved = new URL(ref.replaceAll('&amp;', '&'), new URL(r, origin));
    if (resolved.origin === origin && resolved.pathname.startsWith('/docs/') && !resolved.pathname.startsWith(ARCHIVE)) {
      fail(`${r}: ${ref} leaves the archive`);
    }
  }
}
if (sitemap.includes(`${origin}${ARCHIVE}`)) fail('Sitemap lists archived docs');

// Removed pages forward to their archived copy or successor.
for (const slug of removedSlugs) {
  const r = route('/docs/', slug);
  const html = page(r);
  if (!html) continue;
  if (!html.includes('location.replace') || !html.includes('http-equiv="refresh"')) fail(`Missing redirect: ${r}`);
  if (listed(r)) fail(`Redirect page in sitemap: ${r}`);
}
if (!target('/404.html')) fail('Missing root 404 page');
if (!target('/pagefind/pagefind.js')) fail('Missing Kinex search bundle');
if (readFileSync(join(dist, 'CNAME'), 'utf8').trim() !== 'kinex-agent.com') fail('Incorrect custom domain');
console.log(`${htmlFiles.length} pages checked, ${bad} broken link(s) or routing error(s)`);
process.exit(bad ? 1 : 0);
