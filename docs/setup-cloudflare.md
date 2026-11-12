# Cloudflare setup and cutover runbook

One-time steps to put v2 online. Everything here is on the free plans. Follow it in order. Steps marked 🧪 can be done while the old Netlify site is still live.

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

1. Tell Laurence to stop editing the old site.
2. Re-run the migration (step 3) to pick up the last changes made on `master`.
3. Import the newsletter list. DynamoDB → table → _Explore items_ → select all → _Download results to CSV_, then `npm run subscribers:import -- export.csv --remote`.
4. Merge the `v2` branch into `master` **yourself**, after reviewing the PR. The push to `master` triggers `deploy.yml`.
5. At the domain registrar, switch the nameservers to Cloudflare's. Then add the Worker route: Workers → `laurence-belzile` → Settings → **Domains & Routes** → add `laurencebelzile.com` and `www.laurencebelzile.com`.
6. Once `media.laurencebelzile.com` resolves, remove the `PUBLIC_MEDIA_URL` variable and publish once from the admin.
7. Check: home page, an artwork page, `/en`, `/catalogue2026.pdf`, a link preview (e.g. paste an artwork URL in Messenger), `/admin` login, a test newsletter signup.
8. In Google Search Console, submit `https://laurencebelzile.com/sitemap-index.xml`.
9. After a week without problems: delete the Netlify site, the DynamoDB table and the old S3 buckets (`laulau`, `laurencebelzile.com`), and the IAM keys used by the old Netlify function.
