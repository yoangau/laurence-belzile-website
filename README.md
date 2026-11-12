# laurencebelzile.com

Portfolio of the visual artist Laurence Belzile, built with **Astro + TypeScript** and hosted on **Cloudflare** (free plan).

- **Laurence edits everything at `/admin`**: artworks, exhibitions, CV, bio, PDFs, prices and subscribers. Then she clicks **Publier**, and the site is rebuilt and live about 2 minutes later.
- **Public pages are static HTML**, generated at build time with full SEO: per-page titles, Open Graph/Twitter previews, JSON-LD, `hreflang`, and the sitemap. French is at `/`, English at `/en`.
- **Images and PDFs live in Cloudflare R2**, not in git. The admin creates the web sizes in the browser when an image is uploaded.

## How it fits together

```
/admin (React, behind Cloudflare Access)
   │  save → draft.json        publish → published.json + history/
   ▼
R2 lb-content (private) ──► GitHub Actions deploy.yml: download published.json → astro build → wrangler deploy
R2 lb-media  (public)   ──► media.laurencebelzile.com: img/<id>/<width>.webp, docs/*.pdf
D1 lb                   ──► newsletter subscribers (/api/subscribe)
```

| Path                                                 | What                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/content/schema.ts`                              | **The content model** (Zod). Source of truth for the site, the admin, the API and the migration. |
| `src/content/format.ts`, `text.ts`                   | Shared helpers: titles, prices, image URLs, the small markdown subset.                           |
| `src/pages/[...lang]/`                               | Public pages; each one builds for both `/…` (fr) and `/en/…`.                                    |
| `src/components/`, `src/layouts/`, `src/styles/`     | Public UI (plain Astro + CSS, very little JS).                                                   |
| `src/scripts/`                                       | The bits of client JS: fade-in, year rail and filter, lightbox and swipe, newsletter form.       |
| `src/admin/`                                         | The admin app (React + Mantine), French UI.                                                      |
| `src/server/`, `src/middleware.ts`, `src/pages/api/` | Worker code: Access auth, R2 storage, publish, uploads, subscribers.                             |
| `scripts/migrate/`                                   | One-off migration from the v1 site (`master` before v2).                                         |
| `fixtures/content.sample.json`                       | Small sample content, so a fresh clone builds without Cloudflare access.                         |
| `docs/`                                              | `v2-plan.md` (architecture and decisions), `setup-cloudflare.md` (setup and cutover runbook).    |

## Branches and environments

| Branch    | Site                             | Content and media                  |
| --------- | -------------------------------- | ---------------------------------- |
| `master`  | laurencebelzile.com (production) | the real content                   |
| `staging` | lb.inscape.xyz                   | a separate copy, safe to play with |

Pushing to either branch deploys it (`.github/workflows/deploy.yml`). Code goes feature branch → `staging` (test) → `master` (merged by the owner only). Content never goes through git: each environment's `/admin` edits that environment's data, and "Publier" rebuilds that environment.

## Develop

Requirements: Node 22+ and npm.

```bash
npm ci
cp .dev.vars.example .dev.vars   # lets you open /admin on localhost without logging in
npm run db:migrate:local
npm run dev                      # http://localhost:4321 (uses fixtures/content.sample.json)
```

For the real content and images locally, either migrate from the v1 site (no Cloudflare account needed):

```bash
git worktree add --detach ../legacy-master <a commit of the v1 site>
npm run migrate -- --legacy ../legacy-master --upload local
```

…or pull the production content (needs `wrangler login`): `npm run content:pull`. Images then load from `media.laurencebelzile.com` if you also set `PUBLIC_MEDIA_URL=https://media.laurencebelzile.com`.

Other commands:

| Command            |                                                                             |
| ------------------ | --------------------------------------------------------------------------- |
| `npm run check`    | Type-check everything (Astro + TS).                                         |
| `npm test`         | Unit tests (Vitest).                                                        |
| `npm run test:e2e` | Browser tests (Playwright) against `npm run dev`.                           |
| `npm run build`    | Build the static site into `dist/`.                                         |
| `npm run preview`  | Build, then serve exactly like Cloudflare (`wrangler dev`).                 |
| `npm run deploy`   | Pull published content, build and deploy (normally done by GitHub Actions). |

## Content model in two minutes

- `works` is in **display order, newest first**. Each work is an `artwork` (medium, dimensions in inches, availability, price) or an `exhibition` (venue). Both have `/projet/<id>` pages. **Ids never change** once published, because they're in URLs and purchase e-mails.
- Every text is `{ fr, en }`. An empty `en` shows the French text.
- Text fields accept `*italique*`, `**gras**`, `[lien](https://…)`; long texts also accept blank-line paragraphs and `## Titre`.
- An image is `{ id, width, height, widths, lqip, color, credit }`; its files are `img/<id>/<w>.webp` and `img/<id>/og.jpg`. A replaced image gets a new id, so files can be cached forever.

## Rules

See [`CLAUDE.md`](./CLAUDE.md). In short: nobody but the owner merges into `master`, no images or secrets in git, npm only.
