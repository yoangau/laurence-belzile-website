# laurencebelzile.com — V2 plan

Status: **built on the v2 branch, not deployed.** The code (phases 0–4) is done and tested locally. Phases 5–6 (Cloudflare account, staging, cutover) follow `docs/setup-cloudflare.md`.

Decisions made along the way:

- npm instead of yarn.
- **Only the owner merges into `master`**, never an AI agent (see `CLAUDE.md`).
- Titles are plain text and always shown in italics (as on v1); other texts use a tiny markdown subset instead of HTML.
- Public pages are pre-rendered; `/admin` and `/api` are the only Worker routes.
- Until `deploy.yml` is on `master`, GitHub won't let "Publier" start it, so during staging the rebuild is run by hand with `npm run deploy`.

## 1. What exists today (audit)

**Stack:** Create React App (deprecated) + React 16 + react-router 5, three styling systems at once (Bootstrap 4, Ant Design 5, Emotion), react-reveal, react-lazyload, react-helmet, i18next. One Netlify Function (aws-sdk v2, deprecated) writes newsletter emails to DynamoDB and CloudWatch metrics. Deployed on Netlify from `master`.

**Content lives in 4 places that have to be edited together by hand:**

| What                                                     | Where                                                                                                      | How Laurence changes it today                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 264 artworks / exhibitions                               | `src/data/projects.json`                                                                                   | edit JSON in git                                                                    |
| Titles, descriptions, techniques, credits, CV lines, bio | `src/i18n/fr.json`, `en.json` (keys like `@@expo-title-LB00035`, `LB00234-description`, `expo-ind-2025-0`) | edit 2 JSON files in git, keys must match                                           |
| CV structure                                             | `src/data/resume.json` (only references i18n keys)                                                         | edit JSON in git                                                                    |
| Images                                                   | `public/projects/*.jpg` + `compressed/` + `placeholders/` + `src/data/image-dimensions.json`               | run `image_processing/compress.py` (Python, OpenCV), commit 3 copies of every image |
| Prices                                                   | `image_processing/price_config.json` + `update_prices.py`                                                  | run a script                                                                        |
| PDFs (CV, press, catalogue)                              | `public/resume/`, S3 bucket (catalogue), `netlify.toml` redirect, hard-coded nav link                      | git + AWS console                                                                   |

The commit history confirms the pain: most of her commits are one-line JSON edits ("oeuvre vendue" = flip `available` + null `price`), image batches (3 files per artwork), bio/CV text changes, and PDF swaps. She also had to commit AWS/Netlify config.

**Why Netlify is hitting its limit:** the artwork page (`src/pages/Project.jsx`) loads the **original** JPEG (`/projects/LB00660.jpg` is 6 MB, average ~860 KB) and the 600 MB of originals ship in every deploy. Each artwork view costs ~1–6 MB of bandwidth instead of ~150 KB.

**The "SEO thumbnail SSR":** there is no SSR in the code. `react-helmet` sets per-page `og:` tags in the browser, and social crawlers (Facebook, iMessage, Slack) don't run JS, so the per-artwork thumbnails can only work through Netlify's prerendering setting (bots get a headless-browser render). V2 makes this native: every page is real HTML with its tags already in it.

**Convoluted logic and bugs found** (all disappear with the new data model):

- `available` is tri-state (`true` / `false` / `null`), `buy-ref` is `null` or the string `"null"`, and `price` must also be nulled when sold.
- Titles starting with `@@` are translation keys; others are literal; some contain raw `<i>` HTML parsed with `react-html-parser`.
- Exhibitions are artworks with `expo: true` whose **`dimension` field holds the venue**; `expo-only` is another flag; one stray key `LB00292-description: ""`.
- Dimensions are free strings with mixed `4.5"` / `4,5"` and a trailing space (`"43\" x 57\" "`), so the price map silently misses entries.
- `formatTechnique` passes arrays to `t()` for 3+ techniques (it works by accident).
- Arrow keys and buttons are swapped (ArrowLeft → `next`) to compensate for the reversed list.
- Mobile detection by user-agent regex; filter list items have no `key`; `setTimeout(fn, [10000])`; the hand-written `sitemap.xml` (2024 dates, no artwork pages); `og:title` uses `name=` instead of `property=`; the email function returns raw errors to the client and doesn't await metrics.
- Language is detected in the browser on the same URL, so Google only ever indexes one language.
- Social icons and the catalogue PDF live in two different S3 buckets in two regions.

## 2. Goals

1. Laurence never touches git: an admin page (in French) for artworks, exhibitions, CV, bio, PDFs, prices, and subscribers.
2. Stays free apart from the domain.
3. Images out of the repo; image variants generated automatically on upload.
4. Real server-rendered HTML for SEO and social previews, in both languages.
5. TypeScript, a modern build, far fewer dependencies.
6. Same look and same URLs (`/work`, `/projet/LB00001`, `/cv`, `/info`, `/contact`, `/exhibitions`, `/catalogue2026.pdf`) so search rankings and shared links survive.

## 3. Target architecture

**Host: Cloudflare (free plan).** Static asset requests on Workers are free and unlimited, R2 storage has 10 GB free with **zero egress fees**, D1 (SQLite) is free, and Cloudflare Access protects the admin for up to 50 users for free. Netlify and Vercel both cap bandwidth at about 100 GB, and Vercel Hobby forbids commercial use (she sells work). Requirement: the domain's DNS moves to Cloudflare (free). The registrar can stay where it is.

```
                    ┌───────────── Cloudflare ─────────────────────────────┐
 visitors ─────────►│ Worker "laurence-belzile"                            │
                    │   • static HTML pages (pre-rendered at build)        │
                    │   • /api/subscribe            (public)               │
                    │   • /admin, /api/admin/*      (behind CF Access)     │
                    │                                                      │
 media.laurencebelzile.com ──► R2 bucket lb-media (public, cached)         │
                    │            img/<id>/<w>.webp, docs/*.pdf             │
                    │   R2 bucket lb-content (private)                     │
                    │            draft.json, published.json, history/*,    │
                    │            originals/*                               │
                    │   D1 "lb" : subscribers table                        │
                    └──────────────────────────────────────────────────────┘
                                   ▲  "Publier" → repository_dispatch
                    GitHub Actions: build Astro with published.json → wrangler deploy
```

**Framework: Astro 5 + TypeScript**, with the `@astrojs/cloudflare` adapter.

- Public pages are **pre-rendered at build time** from `published.json`. Every artwork page is real HTML with its own title, description, `og:image`, Twitter card, JSON-LD (`VisualArtwork`, plus an `Offer` when available), canonical URL, and `hreflang`.
  - Why pre-render instead of rendering on each request: the free Workers plan allows 10 ms CPU per request, and a 260-image gallery rendered per request risks exceeding it. Pre-rendered pages cost no CPU, are fastest for SEO, and the only cost is that a change takes ~1–2 min to go live after "Publier".
- `/admin` and `/api/*` are on-demand routes (`prerender = false`) in the same Worker.
- Near-zero JS on public pages: small vanilla/Preact islands for the available/all filter, year rail, swipe + keyboard navigation, and a lightbox (PhotoSwipe) for zoom. Antd, Bootstrap, Emotion, react-reveal, lodash, axios, and helmet are all removed. Rokkitt font is self-hosted (`@fontsource`).
- **i18n:** French at the existing URLs (`/work`, `/projet/LB00012`), English at `/en/work`, `/en/projet/LB00012`, with `hreflang` linking both. The language toggle switches URL.

**Content storage: one validated JSON document**, not a database. ~264 artworks, one editor, small payload:

- `draft.json` is what the admin edits (saved with an ETag so two tabs can't overwrite each other).
- "Publier" copies draft → `published.json`, writes `history/<timestamp>.json`, and triggers the deploy. The admin lists the history with "Restaurer", which replaces what git gave her for undo.
- One Zod schema (`src/content/schema.ts`) is shared by the site, the admin, the API, and the migration script.
- D1 is used only for newsletter subscribers (appends from the public, which a JSON file can't handle safely).

**Images: variants generated in her browser at upload.** In the admin, a Web Worker uses jSquash (WASM, works in Safari/Chrome) to produce WebP at 480/960/1600/2400 px, a tiny blurred preview (inline base64, replacing `placeholders/`), width/height (replacing `image-dimensions.json`), and a dominant color. The Worker streams them to R2. No server CPU is used, the Python scripts go away, and it works from her Mac with nothing installed. The original is kept in the private bucket as an archive. URLs are immutable (`img/<random-id>/1600.webp`) and cached for a year.
Bandwidth: a gallery thumb is ~40–80 KB and an artwork page ~150–300 KB, all free from R2 anyway.

**Admin auth: Cloudflare Access** in front of `/admin*` and `/api/admin/*` (login with her Google account or an emailed one-time code). The Worker also verifies the `Cf-Access-Jwt-Assertion` header, so a misconfigured Access rule can't expose the API. Fallback if they don't want Zero Trust: in-app "Sign in with Google" restricted to her address (~100 lines with `arctic`).

## 4. New data model (sketch)

```ts
type L10n = { fr: string; en: string };          // markdown allowed (*italics*)
type Image = { id: string; w: number; h: number; lqip: string; color: string;
               credit?: string /* photographer id */; alt?: L10n };

type Artwork = {
  id: string;                 // "LB00132" — kept, it's in URLs and mail subjects
  title?: L10n;               // empty → "sans titre" / "untitled"
  year: number;
  widthIn?: number; heightIn?: number;          // structured → price lookup works
  techniques: string[];       // ids into settings.techniques (fr/en labels)
  status: 'available' | 'sold' | 'not-for-sale';
  price?: number;             // CAD; suggested from the price table
  saleUrl?: string;           // gallery link; default = mailto with [ID] subject
  description?: L10n;
  images: Image[];            // [0] = main
  displayWidth: number;       // today's "width: 45%" — her curated scale in the feed
  showOnHome: boolean; hidden: boolean; order: number;
};

type Exhibition = {           // was: artworks with expo:true + venue in "dimension"
  id: string; title: L10n; venue: string; city: string; year: number;
  description?: L10n; images: Image[]; artworkIds: string[];
};

type CvSection = { id: string; title: L10n;
  entries: { year: number; text: L10n; url?: string }[] };

type Content = {
  artworks: Artwork[]; exhibitions: Exhibition[]; cv: CvSection[];
  pages: { bio: L10n; statement?: L10n };
  documents: { id: string; label: L10n; file: L10n /* R2 key per language */; inNav: boolean; legacyPath?: string }[];
  settings: { email: string; socials: {...}[]; techniques: {id; label: L10n}[];
              photographers: {id; name}[]; priceTable: {w; h; price}[] };
};
```

`legacyPath` keeps `/catalogue2026.pdf` and `/resume/Belzile_CV_FR.pdf` working (served by redirect).

## 5. Admin (French UI, React + Mantine, loaded only on /admin)

- **Œuvres:** grid with search, filter by year/status, and a one-click **"Marquer vendue"** on each card (her most common edit). Editor: drag-drop images (reorder, main image, photo credit per image), title FR/EN, year, dimensions (W × H in inches), techniques picker, status, price (pre-filled from the price table, editable), sale link, display size slider with live preview, description FR/EN, visibility.
- **Expositions:** same pattern, plus picking linked artworks.
- **CV:** sections → entries (year, text FR/EN, link), drag to reorder.
- **Bio / démarche:** side-by-side FR/EN markdown editor.
- **Documents:** upload/replace the CV, press review, and catalogue PDFs (FR/EN), with a "show in menu" toggle (replaces the hard-coded "catalogue" link).
- **Réglages:** price table (with "apply to all available works" plus a preview of the changes), techniques vocabulary, photographers, contact email, socials.
- **Abonnés:** list, delete, export CSV.
- **Publier:** shows a diff summary ("3 œuvres modifiées, 1 ajoutée"), then live in ~2 min. **Historique** lets her restore any version.
- Nice-to-have (phase 6): a "Prévisualiser" button that renders a draft page on demand under /admin.

## 6. Build plan

Every phase ends with something runnable and is verified locally with `wrangler dev` (it emulates R2/D1, so none of this needs the Cloudflare account until phase 5).

| #   | Phase                 | Output                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Who                                                                     |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 0   | Scaffold              | Astro + TS strict + Cloudflare adapter + wrangler config (R2/D1 bindings), ESLint/Prettier, Vitest, Playwright, GitHub Actions CI (typecheck, test, build)                                                                                                                                                                                                                                                                                                              | me                                                                      |
| 1   | Schema + migration    | `schema.ts`; `scripts/migrate.ts` converts `projects.json` + `fr/en.json` + `resume.json` + `price_config.json` into `content.json` (resolves `@@` keys, `<i>` → markdown, venue out of `dimension`, parses dimensions, normalizes `4,5`), uses `sharp` for all variants/LQIP, and uploads to R2 (local or remote). **Idempotent**, so it can be re-run at cutover. Tests: every artwork, image, CV line, and translation accounted for; a report of anything ambiguous | me                                                                      |
| 2   | Public site           | All pages at parity, both languages, SEO (meta/OG/JSON-LD/sitemap/robots/hreflang/canonical), redirects for old URLs (`/projects/*`, PDFs). Playwright screenshots of old vs new for a visual diff                                                                                                                                                                                                                                                                      | sub-agent A                                                             |
| 3   | API + admin           | `/api/admin/*` (content GET/PUT with ETag, upload, publish, history, subscribers) + JWT check; `/api/subscribe` → D1; the admin app; browser image pipeline                                                                                                                                                                                                                                                                                                             | sub-agent B (in parallel with 2, since both only depend on `schema.ts`) |
| 4   | Publish pipeline      | Workflow on `repository_dispatch: content-published` + push to master: fetch `published.json` → build → `wrangler deploy`. Fine-grained GitHub token (dispatch only) stored as a Worker secret                                                                                                                                                                                                                                                                          | me                                                                      |
| 5   | Staging on Cloudflare | Deploy `v2` to `*.workers.dev`, set up Access, R2 custom domain; Laurence tries the admin on real content while Netlify still serves production                                                                                                                                                                                                                                                                                                                         | you + me                                                                |
| 6   | Cutover               | Content freeze → re-run migration → move DNS → verify → disable Netlify → merge `v2` → `master`. Optional: delete the DynamoDB table and old S3 buckets after export                                                                                                                                                                                                                                                                                                    | you + me                                                                |

Phases 0–4 are doable in one long session: I do 0–1, then run A and B in parallel as sub-agents against the frozen schema, then integrate, test end-to-end in a local browser, and push. Phases 5–6 need your Cloudflare account, so they become a short checklist.

## 7. What you'll have to click (I can't do these from here)

1. Create a Cloudflare account and add the domain (Cloudflare imports the DNS records; then you change the nameservers at the registrar).
2. Create R2 buckets `lb-media` and `lb-content`, a D1 database `lb`, and attach `media.laurencebelzile.com` to `lb-media`.
3. Create an API token (Workers + R2 + D1 edit) and add it to GitHub secrets as `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`.
4. In Zero Trust (free plan), add an Access application for `laurencebelzile.com/admin*` and `/api/admin/*` with a policy for her email (+ yours).
5. Create a fine-grained GitHub token (this repo, "Contents: read" + "Actions: write") and store it as a Worker secret for the Publier button.
6. Export current subscribers from DynamoDB (or give me read access to do it) → import into D1.

## 8. Risks and notes

- **Git history stays 626 MB** even after images leave `master`. Clones can be shallow; rewriting history is optional and destructive, so it stays out of scope unless you want it.
- **Publish delay** is ~1–2 min (build + deploy). If that ever annoys her, switching artwork pages to on-demand rendering with edge caching is a config change, not a rewrite.
- **Free-tier limits** are far above this site's scale: 10 GB R2 (needs ~1.5 GB with originals), 100k Worker invocations/day (only `/api` and `/admin` count, not static pages), 2,000 GitHub Actions min/month (or unlimited if the repo stays public).
- **Analytics:** keep the existing GA4 tag, or swap for Cloudflare Web Analytics (free, no cookie banner). Your call.
- **Newsletter:** today the site only _collects_ emails; nothing sends them. CSV export makes it easy to paste into Mailchimp or Brevo (both have free tiers) when she wants to send.
