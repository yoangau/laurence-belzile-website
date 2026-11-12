# laurencebelzile.com

Portfolio of visual artist Laurence Belzile. Astro + TypeScript on Cloudflare Workers; content is edited through `/admin`, not git. See `docs/v2-plan.md` for the architecture and `README.md` for day-to-day commands.

## Hard rules (for AI agents and automation)

1. **Never merge into `master`.** Do not merge, rebase onto, push to, fast-forward, or open-and-merge a PR into `master`, by any route (git, GitHub API, auto-merge). Only the repository owner merges into `master`, after they have tested and agreed with Laurence. Opening a PR targeting `master` is allowed only when explicitly asked; merging it never is.
2. **Never enable auto-merge** or change branch protection.
3. **Never commit images or PDFs.** Media lives in Cloudflare R2. The repo holds code only (plus the small sample fixture in `fixtures/`).
4. **Never commit secrets.** Local secrets go in `.dev.vars` (gitignored); production secrets are Worker secrets / GitHub Actions secrets.
5. Use **npm** (not yarn or pnpm). Commit `package-lock.json`.

## Conventions

- TypeScript strict everywhere. The content schema in `src/content/schema.ts` is the single source of truth, shared by the site, the API, the admin, and the migration script. Change it there first.
- The admin UI is in French. Code, comments, and commit messages are in English.
- Before pushing: `npm run check && npm test && npm run build`.
