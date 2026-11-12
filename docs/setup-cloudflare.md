# Cloudflare setup and cutover runbook

One-time steps to put v2 online. Everything here is on the free plans. Follow it in order. Steps marked 🧪 can be done while the old Netlify site is still live.

**Environments.** `master` → production (laurencebelzile.com, buckets `lb-media`/`lb-content`, D1 `lb`, Worker
`laurence-belzile`). `staging` → lb.inscape.xyz (buckets `lb-media-staging`/`lb-content-staging`, D1 `lb-staging`,
Worker `laurence-belzile-staging`, `env.staging` in `wrangler.jsonc`). Each has its own data, admin and "Publier".
Status: staging is live; production resources exist but the domain is not switched yet.

## 1. Account and domain

1. Create a Cloudflare account (free plan).
2. 🧪 **Add a site** → `laurencebelzile.com`. Cloudflare imports the existing DNS records. **Don't change the nameservers yet.** That's the cutover (step 8).

## 2. Storage (R2) and database (D1)

From this repo, after `npm ci` and `npx wrangler login`:

```bash
npx wrangler r2 bucket create lb-media      # public: images and PDFs
npx wrangler r2 bucket create lb-content    # private: draft/published content, history, originals
npx wrangler d1 create lb                   # newsletter subscribers
```

Copy the `database_id` printed by `d1 create` into `wrangler.jsonc` (replace `REPLACE_WITH_D1_ID`), then commit.

🧪 Make the media bucket public on its own subdomain: R2 → `lb-media` → Settings → **Custom Domains** → add `media.laurencebelzile.com`. This works once the domain is active on Cloudflare (step 8). Until then, the site can use the `/media` route of the Worker. See "Staging" below.

## 3. Upload the content (migration)

Create an R2 API token: R2 → **Manage API tokens** → _Object Read & Write_ on both buckets. Then:

```bash
git worktree add --detach ../legacy-master master        # the v1 site, read-only
export CLOUDFLARE_ACCOUNT_ID=…  R2_ACCESS_KEY_ID=…  R2_SECRET_ACCESS_KEY=…
npm run migrate -- --legacy ../legacy-master --upload remote --with-originals
```

Read `.migration/report.md`. It lists anything that couldn't be converted automatically.

## 4. Admin login (Cloudflare Access)

Already set up through the API (Zero Trust team `laurencebelzile`, free plan):

- Login method: **one-time code by e-mail** (no password to remember or leak).
- Policy "Admins laurencebelzile": the allowed e-mails, with a 30-day session.
- Application "Admin Laurence Belzile": protects `/admin` and `/api/admin` on the staging domain. **At cutover, add** `laurencebelzile.com/admin` and `laurencebelzile.com/api/admin` to its destinations (Zero Trust → Access → Applications → edit).

`CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` (the application's audience tag, not a secret) are in `wrangler.jsonc`. The allowed e-mails are a Worker secret, so they stay out of this public repo:

```bash
echo "laurence.belzile.arts@gmail.com,you@example.com" | npx wrangler secret put ADMIN_EMAILS
```

The Worker verifies the Access token itself and refuses any e-mail not in `ADMIN_EMAILS`, even if the Access policy is misconfigured. To add or remove someone, change **both** the Access policy and this secret.

## 5. The "Publier" button

1. GitHub → Settings → Developer settings → **Fine-grained token**: only this repository, permission **Actions: Read and write**. Expiry: 1 year (put a reminder in your calendar).
2. `npx wrangler secret put GITHUB_TOKEN`

## 6. GitHub Actions

Repository → Settings → Secrets and variables → Actions → **New repository secret**:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token with Workers Scripts, Workers R2 Storage and D1 (Edit) permissions. The account id is in `wrangler.jsonc`.

`deploy.yml` then deploys on every push to `master` (production) and to the v2 branch (staging, until the cutover), and when Laurence clicks "Publier". It needs no other secret. The media domain is set at the top of the workflow (`PUBLIC_MEDIA_URL`).

## 7. 🧪 Staging (test before switching the domain)

```bash
npx wrangler d1 migrations apply lb --remote
PUBLIC_MEDIA_URL=/media npm run deploy       # pulls published.json, builds, deploys
```

The site is now on `https://laurence-belzile.<account>.workers.dev`. Laurence can try `/admin` there (with the Access application covering that hostname).

⚠️ GitHub only lets the "Publier" button start `deploy.yml` once that file is on the default branch (`master`). Before the merge, "Publier" saves the published version but the rebuild has to be run by hand with `npm run deploy`. The admin says so when `GITHUB_TOKEN` is not set.

## 8. Cutover (the owner does this, not an AI agent)

> **Staging is a playground.** Until the cutover, Laurence keeps editing the old site (git) and
> uses the staging admin only to try things. Step 2 below **replaces** everything done on staging.

1. Tell Laurence to stop editing the old site.
2. Re-run the migration (step 3) to pick up the last changes made on `master`. This overwrites
   `draft.json` and `published.json` with the real content; images already uploaded are skipped.
3. Clear the playground leftovers:
   - Published versions made on staging (Historique):
     `npx wrangler r2 object delete` each `lb-content/history/…` key, or empty the `history/` folder
     from the R2 dashboard.
   - Test sign-ups: `npx wrangler d1 execute lb --remote --command "DELETE FROM subscribers"`
     (do this **before** importing the real list).
   - Images Laurence uploaded while testing stay in `lb-media` unused. They're harmless and can stay.
4. Import the newsletter list. DynamoDB → table → _Explore items_ → select all → _Download results to CSV_, then `npm run subscribers:import -- export.csv --remote`.
5. Merge the `v2` branch into `master` **yourself**, after reviewing the PR. The push to `master` triggers `deploy.yml`.
6. At Namecheap (Domain List → `laurencebelzile.com` → Nameservers → _Custom DNS_), set
   `algin.ns.cloudflare.com` and `mimi.ns.cloudflare.com`. Wait until Cloudflare shows the zone as **Active**.
7. Point everything at the real domain (an AI agent can do this through the API if you ask):
   - `wrangler.jsonc` → `routes`: add `laurencebelzile.com` and `www.laurencebelzile.com` (custom domains).
   - R2 → `lb-media` → Custom Domains: add `media.laurencebelzile.com`.
   - `deploy.yml` → `PUBLIC_MEDIA_URL: https://media.laurencebelzile.com`, and drop the v2 branch from `push`.
   - Zero Trust → Access → "Admin Laurence Belzile": add `laurencebelzile.com/admin` and `laurencebelzile.com/api/admin`.
   - `wrangler.jsonc` → `DEPLOY_BRANCH: "master"`, so "Publier" starts the production deploy.
   - Push to `master`, which deploys.
8. Check: home page, an artwork page, `/en`, `/catalogue2026.pdf`, a link preview (e.g. paste an artwork URL in Messenger), `/admin` login, a test newsletter signup.
9. In Google Search Console, submit `https://laurencebelzile.com/sitemap-index.xml`.
10. After a week without problems: delete the Netlify site, the DynamoDB table and the old S3 buckets (`laulau`, `laurencebelzile.com`), and the IAM keys used by the old Netlify function.
