# Kinex website

Standalone Kinex landing page and documentation for **https://kinex-agent.com**,
copied from the Kinex section of `stacx-lab.github.io`.

## Develop and check

Use Node.js 22.12 or later (`.nvmrc` selects Node 22).

```sh
npm ci
npm run dev
npm run check
npm run preview
```

`check` runs Astro's type checks, builds the site and Pagefind search index, and
checks internal links, anchors, media, canonical URLs, and sitemap entries.
Search is available in the production preview after building.

## Content and routes

| Source | Published path |
| --- | --- |
| `src/pages/index.astro` | `/` |
| `src/content/docs/*.{md,mdx}` | `/docs/` and `/docs/<slug>/` |
| `src/pages/docs/all.astro` | `/docs/all/` |
| `public/img/`, `public/media/`, `public/video/` | `/img/`, `/media/`, `/video/` |
| Generated Pagefind index | `/pagefind/` |

Edit documentation here going forward. Root-relative documentation links use
`/docs/<slug>/`. Shared site facts are in `src/config.ts`; landing-page data is in
`src/data/`. The Blog navigation link points to the lab's existing blog.
The original gallery production sources remain in `stacx-lab.github.io/gallery/`.
This repository includes the published media and the two tutorial videos imported
by the docs in `gallery/.masters/`. These copies are ordinary Git files, so the
standalone build does not need Git LFS or the lab checkout.

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
