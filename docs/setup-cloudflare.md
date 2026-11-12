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

1. Zero Trust dashboard → choose a team name (e.g. `laurencebelzile`), free plan.
2. **Access → Applications → Add → Self-hosted**:
   - Domain: `laurencebelzile.com`, path `admin`. Add a second destination with path `api/admin`. During staging, also add your `*.workers.dev` hostname with the same paths.
   - Login methods: _One-time PIN_ (e-mail code), and _Google_ if you want.
   - Policy: **Allow** → Emails → Laurence's address and yours.
3. Copy the application's **AUD tag**, then:
   ```bash
   npx wrangler secret put CF_ACCESS_AUD           # paste the AUD tag
   ```
4. In `wrangler.jsonc`, set `CF_ACCESS_TEAM_DOMAIN` to `<team>.cloudflareaccess.com` and check `ADMIN_EMAILS` (comma-separated).

The Worker verifies the Access token itself and refuses any e-mail not in `ADMIN_EMAILS`, even if the Access policy is misconfigured.

## 5. The "Publier" button

1. GitHub → Settings → Developer settings → **Fine-grained token**: only this repository, permission **Actions: Read and write**. Expiry: 1 year (put a reminder in your calendar).
2. `npx wrangler secret put GITHUB_TOKEN`

## 6. GitHub Actions

Repository → Settings → Secrets and variables → Actions:

- Secret `CLOUDFLARE_API_TOKEN`: create it in Cloudflare → My Profile → API Tokens with the template _Edit Cloudflare Workers_, and add the permissions **Workers R2 Storage: Edit** and **D1: Edit**.
- Secret `CLOUDFLARE_ACCOUNT_ID`.
- Variable `PUBLIC_MEDIA_URL`: leave unset once `media.laurencebelzile.com` works. During staging, set it to `/media`.

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
