# Kinex website

Standalone Kinex landing page and documentation for **https://kinex-agent.com**,
copied from the Kinex section of `stacx-lab.github.io`.

## Develop and check

Use Node.js 22.12 or later (`.nvmrc` selects Node 22).

```sh
npm ci
git lfs install --local
git lfs pull
npm run dev
npm run check
npm run preview
```

`check` runs Astro's type checks, builds the site and Pagefind search index, and
checks internal links, anchors, media, canonical URLs, and sitemap entries.
The build rejects unresolved LFS pointers, invalid video containers, and MP4s
without fast-start metadata, both before bundling and in the published output.
Search is available in the production preview after building.

## Content and routes

| Source | Published path |
| --- | --- |
| `src/pages/index.astro` | `/` |
| `src/content/docs/*.{md,mdx}` | `/docs/` and `/docs/<slug>/` |
| `src/pages/docs/all.astro` | `/docs/all/` |
| `src/content/docs-v1.0/*.{md,mdx}` | `/docs/v1.0/` and `/docs/v1.0/<slug>/` (archived v1.0.0 docs) |
| `src/pages/docs/v1.0/all.astro` | `/docs/v1.0/all/` |
| `src/pages/docs/[moved].astro` | `/docs/<slug>/` for v1.0 pages with no current page (redirects) |
| `public/img/`, `public/media/`, `public/video/` | `/img/`, `/media/`, `/video/` |
| Generated Pagefind index | `/pagefind/` |

Edit documentation here going forward. The pages describe the Kinex version in
`src/config.ts` (`site.version` and `site.sourceRef`). Root-relative documentation links use
`/docs/<slug>/`. Shared site facts are in `src/config.ts`; landing-page data is in
`src/data/`.
The original gallery production sources remain in `stacx-lab.github.io/gallery/`.
This repository includes the published media and the two tutorial videos imported
by the docs in `gallery/.masters/`. Those two masters use Git LFS, matching the
source repository. Install Git LFS and run the commands above after cloning.
The Actions checkout downloads LFS content before building, and Astro bundles
the actual tutorial videos into `dist/_astro/` for Pages to serve.

Compressed MP4/WebM delivery files in `public/` stay in ordinary Git. Keep MP4s
in H.264/yuv420p with fast-start metadata; retain WebM alternatives and poster
images for gallery videos. Players use `preload="none"` to avoid downloading
videos before playback. The build is independent of the lab checkout.

## Archived docs

`src/content/docs-v1.0/` is a frozen copy of the v1.0.0 documentation, and
`src/components/v1.0/` holds the diagrams it imports. Don't edit either.
Archived pages show a banner that links to their current page, carry `noindex`,
and are kept out of the sitemap and search. A v1.0 page with no current page of
the same slug (such as `robotstudio`) gets a redirect stub at `/docs/<slug>/`
that forwards to its archived copy, keeping query strings and anchors. When a
current page replaces a v1.0 page under a new slug, map the old slug to the new
one in `archive.moved` in `src/config.ts`. Keep the media, the `gallery/.masters/`
videos and the `prose.css` classes the archived pages use. `npm run check`
verifies all three route sets.

## GitHub Pages and domain setup

The remote is `git@github.com:stacx-lab/kinex-page.git`. The included Actions
workflow checks and deploys `dist/` on pushes to `main`, or on a manual run.

1. Push this repository to GitHub. In **Settings → Pages**, select **GitHub
   Actions** as the source and save **kinex-agent.com** as the custom domain.
2. At the domain's DNS provider, configure the following records (replace any
   conflicting parking records for these hosts):

   | Type | Host | Value |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | stacx-lab.github.io |

3. Once GitHub's domain check and certificate provisioning finish, enable
   **Enforce HTTPS**. Check the homepage, `/docs/`, and a documentation search.
4. Deploy the changes in `stacx-lab.github.io` after this domain works. Its old
   `/kinex/`, `/kinex/docs/`, `/kinex/docs/all/`, and individual documentation
   routes redirect here, preserving query strings and heading anchors with
   JavaScript. A meta refresh and clickable link provide a fallback.

GitHub Pages serves these legacy redirects as static HTML, not HTTP 301 responses.
Only the `kinex-page` repository should have `kinex-agent.com` configured; the
lab repository keeps its existing domain. `public/CNAME` records the intended
domain, but an Actions deployment still requires the custom domain to be saved
in GitHub's Pages settings. The site builds at `/`, not `/kinex-page/`.

See [GitHub's custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
for DNS and custom-domain details. `SITE_URL` overrides the build's canonical
origin for testing; production defaults to `https://kinex-agent.com`.
